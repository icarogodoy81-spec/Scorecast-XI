import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCORING_SECRET = process.env.SCORING_SECRET;

type FootballDataMatch = {
  id: number;
  status: string;
  utcDate: string;
  homeTeam: {
    id: number | null;
    name: string;
    shortName?: string;
    tla?: string;
  };
  awayTeam: {
    id: number | null;
    name: string;
    shortName?: string;
    tla?: string;
  };
  score?: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
};

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  scored_at: string | null;
};

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function getOutcome(home: number, away: number) {
  if (home > away) return 'HOME';
  if (away > home) return 'AWAY';
  return 'DRAW';
}

function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
) {
  const predictedOutcome = getOutcome(predictedHome, predictedAway);
  const actualOutcome = getOutcome(actualHome, actualAway);

  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  const exactScore =
    predictedHome === actualHome && predictedAway === actualAway;

  if (exactScore) {
    return 4;
  }

  const correctWinnerAndGoalDifference =
    actualOutcome !== 'DRAW' &&
    predictedOutcome === actualOutcome &&
    predictedDiff === actualDiff;

  if (correctWinnerAndGoalDifference) {
    return 3;
  }

  const correctWinnerOrDraw = predictedOutcome === actualOutcome;

  if (correctWinnerOrDraw) {
    return 2;
  }

  return 0;
}

function isAuthorized(request: Request) {
  const url = new URL(request.url);

  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // Allow local testing without the secret.
  if (isLocalhost) {
    return true;
  }

  if (!SCORING_SECRET) {
    return false;
  }

  const scoringSecretHeader = request.headers.get('x-scoring-secret');
  const authorizationHeader = request.headers.get('authorization');

  const bearerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.replace('Bearer ', '').trim()
    : null;

  return (
    scoringSecretHeader === SCORING_SECRET ||
    bearerToken === SCORING_SECRET
  );
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized scoring request' },
        { status: 401 }
      );
    }

    if (!FOOTBALL_DATA_API_KEY) {
      return NextResponse.json(
        { error: 'Missing FOOTBALL_DATA_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing Supabase server env variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const today = new Date();

    const past = new Date();
    past.setDate(today.getDate() - 30);

    const dateFrom = formatDate(past);
    const dateTo = formatDate(today);

    const footballUrl = `https://api.football-data.org/v4/competitions/BSA/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

    const footballResponse = await fetch(footballUrl, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_API_KEY,
      },
      cache: 'no-store',
    });

    if (!footballResponse.ok) {
      const text = await footballResponse.text();

      return NextResponse.json(
        {
          error: 'Failed to fetch finished matches from football-data.org',
          status: footballResponse.status,
          details: text,
        },
        { status: footballResponse.status }
      );
    }

    const footballData = await footballResponse.json();

    const finishedMatches: FootballDataMatch[] = (
      footballData.matches || []
    ).filter((match: FootballDataMatch) => {
      const actualHome = match.score?.fullTime?.home;
      const actualAway = match.score?.fullTime?.away;

      return (
        match.status === 'FINISHED' &&
        actualHome !== null &&
        actualHome !== undefined &&
        actualAway !== null &&
        actualAway !== undefined
      );
    });

    let updatedPredictions = 0;
    const scoredMatches = [];

    for (const match of finishedMatches) {
      const actualHome = match.score?.fullTime?.home;
      const actualAway = match.score?.fullTime?.away;

      if (actualHome === null || actualHome === undefined) continue;
      if (actualAway === null || actualAway === undefined) continue;

      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, user_id, match_id, home_score, away_score, scored_at')
        .eq('match_id', match.id)
        .is('scored_at', null);

      if (predictionsError) {
        throw new Error(predictionsError.message);
      }

      const predictionRows = (predictions || []) as PredictionRow[];

      for (const prediction of predictionRows) {
        const points = calculatePoints(
          prediction.home_score,
          prediction.away_score,
          actualHome,
          actualAway
        );

        const { error: updateError } = await supabase
          .from('predictions')
          .update({
            points,
            actual_home_score: actualHome,
            actual_away_score: actualAway,
            match_status: match.status,
            scored_at: new Date().toISOString(),
          })
          .eq('id', prediction.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        updatedPredictions += 1;
      }

      scoredMatches.push({
        matchId: match.id,
        homeTeam: match.homeTeam.shortName || match.homeTeam.name,
        awayTeam: match.awayTeam.shortName || match.awayTeam.name,
        actualHome,
        actualAway,
        predictionsScored: predictionRows.length,
      });
    }

    return NextResponse.json({
      success: true,
      dateFrom,
      dateTo,
      finishedMatchesFound: finishedMatches.length,
      updatedPredictions,
      scoredMatches,
    });
  } catch (error) {
    console.error('Scoring error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to calculate points',
      },
      { status: 500 }
    );
  }
}

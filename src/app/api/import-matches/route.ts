import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCORING_SECRET = process.env.SCORING_SECRET;

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  scored_at: string | null;
};

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

  if (predictedHome === actualHome && predictedAway === actualAway) return 4;
  if (actualOutcome !== 'DRAW' && predictedOutcome === actualOutcome && predictedDiff === actualDiff) return 3;
  if (predictedOutcome === actualOutcome) return 2;
  return 0;
}

function isAuthorized(request: Request) {
  const url = new URL(request.url);
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (isLocalhost) return true;
  if (!SCORING_SECRET) return false;

  const scoringSecretHeader = request.headers.get('x-scoring-secret');
  const authorizationHeader = request.headers.get('authorization');
  const bearerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.replace('Bearer ', '').trim()
    : null;

  return scoringSecretHeader === SCORING_SECRET || bearerToken === SCORING_SECRET;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized scoring request' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing Supabase server env variables' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: finishedMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_score, away_score, status')
      .eq('status', 'finished')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (matchesError) {
      throw new Error(matchesError.message);
    }

    let updatedPredictions = 0;
    const scoredMatches = [];

    for (const match of finishedMatches || []) {
      const actualHome = match.home_score as number;
      const actualAway = match.away_score as number;

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
            match_status: 'finished',
            scored_at: new Date().toISOString(),
          })
          .eq('id', prediction.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        updatedPredictions += 1;
      }

      if (predictionRows.length > 0) {
        scoredMatches.push({
          matchId: match.id,
          actualHome,
          actualAway,
          predictionsScored: predictionRows.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      finishedMatchesFound: (finishedMatches || []).length,
      updatedPredictions,
      scoredMatches,
    });
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate points' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}

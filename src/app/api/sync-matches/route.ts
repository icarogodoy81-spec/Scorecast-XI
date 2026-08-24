import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Add this security check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of your existing sync code ...
}


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_BASE_URL = process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4';

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  season?: { id: number };
  homeTeam: { id: number; name: string; crest: string };
  awayTeam: { id: number; name: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase server env variables' }, { status: 500 });
  }
  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ error: 'Missing FOOTBALL_DATA_API_KEY' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report: Array<{
    code: string;
    name: string;
    season: number | string | null;
    status: number | string | null;
    matches: number;
  }> = [];

  try {
    let total = 0;
    const now = new Date();
    
    // FIX 1: Look back 30 days instead of 7 to catch older matches stuck on "TIMED"
    const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    for (const competition of COMPETITIONS) {
      
      // FIX 2: Skip the redundant competition API call to prevent Next.js timeouts.
      // We go straight to fetching the matches.
      const res = await fetch(
        `${FOOTBALL_BASE_URL}/competitions/${competition.code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
      );

      // Sleep 6.5s to stay under the 10 calls/minute limit safely
      await new Promise((r) => setTimeout(r, 6500));

      if (!res.ok) {
        report.push({ code: competition.code, name: competition.name, season: null, status: res.status, matches: 0 });
        continue;
      }

      const json = await res.json();
      const apiMatches: ApiMatch[] = json.matches || [];

      if (apiMatches.length === 0) {
        report.push({ code: competition.code, name: competition.name, season: null, status: 'no-matches', matches: 0 });
        continue;
      }

      // Extract the season ID directly from the first match
      const seasonId = apiMatches[0].season?.id || null;

      const rows = apiMatches.map((m) => ({
        api_fixture_id: m.id,
        fixture_id: m.id,
        league_id: competition.id,
        season: seasonId,
        round: m.matchday ? `Round ${m.matchday}` : null,
        home_team_id: m.homeTeam.id,
        home_team_name: m.homeTeam.name,
        home_team_logo: m.homeTeam.crest,
        away_team_id: m.awayTeam.id,
        away_team_name: m.awayTeam.name,
        away_team_logo: m.awayTeam.crest,
        date: m.utcDate,
        fixture_date: m.utcDate,
        status: m.status,
        status_short: m.status,
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
        home_goals: m.score.fullTime.home,
        away_goals: m.score.fullTime.away,
        competition_code: competition.code,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from('fixtures')
          .upsert(rows, { onConflict: 'api_fixture_id' });

        if (error) {
          throw new Error(error.message);
        }
        total += rows.length;
      }

      report.push({ code: competition.code, name: competition.name, season: seasonId, status: res.status, matches: rows.length });
    }

    return NextResponse.json({ success: true, count: total, report });
  } catch (error) {
    console.error('Sync matches error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync matches', report },
      { status: 500 }
    );
  }
}

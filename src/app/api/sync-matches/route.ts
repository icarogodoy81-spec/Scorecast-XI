import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COMPETITIONS } from '@/lib/competitions';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_BASE_URL = process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4';

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
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

    for (const competition of COMPETITIONS) {
      // 1. Get this competition's current season
      const compRes = await fetch(
        `${FOOTBALL_BASE_URL}/competitions/${competition.code}`,
        { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
      );

      await new Promise((r) => setTimeout(r, 7000)); // stay under 10 calls/min

      if (!compRes.ok) {
        report.push({ code: competition.code, name: competition.name, season: null, status: compRes.status, matches: 0 });
        continue;
      }

      const compJson = await compRes.json();
      const seasonId: number | null = compJson.currentSeason?.id ?? null;

      if (!seasonId) {
        report.push({ code: competition.code, name: competition.name, season: null, status: 'no-current-season', matches: 0 });
        continue;
      }

      // 2. Get that season's matches
      const res = await fetch(
        `${FOOTBALL_BASE_URL}/competitions/${competition.code}/matches?season=${seasonId}`,
        { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
      );

      await new Promise((r) => setTimeout(r, 7000));

      if (!res.ok) {
        report.push({ code: competition.code, name: competition.name, season: seasonId, status: res.status, matches: 0 });
        continue;
      }

      const json = await res.json();
      const apiMatches: ApiMatch[] = json.matches || [];

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

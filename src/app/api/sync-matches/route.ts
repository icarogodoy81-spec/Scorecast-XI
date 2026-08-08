// src/app/api/sync-matches/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_BASE_URL = process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4';

const COMPETITION_CODE = 'BSA';
const COMPETITION_ID = 2013;
const SEASON = 2026;

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

  try {
    const res = await fetch(
      `${FOOTBALL_BASE_URL}/competitions/${COMPETITION_CODE}/matches`,
      { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`football-data.org error: ${res.status} ${text}`);
    }

    const json = await res.json();
    const apiMatches: ApiMatch[] = json.matches || [];

    const rows = apiMatches.map((m) => ({
      api_fixture_id: m.id,
      fixture_id: m.id,
      league_id: COMPETITION_ID,
      season: SEASON,
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
      competition_code: COMPETITION_CODE,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('fixtures')
      .upsert(rows, { onConflict: 'api_fixture_id' });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Sync matches error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync matches' },
      { status: 500 }
    );
  }
}

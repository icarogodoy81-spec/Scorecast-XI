import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase server env variables' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const leagueId = searchParams.get('league_id');
  const competitionCode = searchParams.get('competition_code');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from('fixtures')
    .select(
      'id, api_fixture_id, league_id, round, competition_code, home_team_name, away_team_name, home_team_logo, away_team_logo, date, status, home_score, away_score'
    )
    .order('date', { ascending: true });

  if (competitionCode) {
    query = query.eq('competition_code', competitionCode.toUpperCase());
  } else if (leagueId) {
    query = query.eq('league_id', Number(leagueId));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = (data || []).map((row) => ({
    id: row.id,
    api_fixture_id: row.api_fixture_id ?? row.id,
    home_team: row.home_team_name,
    away_team: row.away_team_name,
    home_logo: row.home_team_logo,
    away_logo: row.away_team_logo,
    utcDate: row.date,
    status: row.status,
    group_name: row.round,
    league_id: row.league_id,
    competition_code: row.competition_code,
    score: {
      fullTime: { home: row.home_score, away: row.away_score },
    },
  }));

  return NextResponse.json({ matches });
}

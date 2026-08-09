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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from('fixtures')
    .select(
      'id, home_team_name, away_team_name, home_team_logo, away_team_logo, fixture_date, status_short, round, home_goals, away_goals, league_id, api_fixture_id'
    )
    .order('fixture_date', { ascending: true });

  if (leagueId) {
    query = query.eq('league_id', leagueId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = (data || []).map((row) => ({
    id: row.id,
    api_fixture_id: row.api_fixture_id,
    home_team: row.home_team_name,
    away_team: row.away_team_name,
    home_logo: row.home_team_logo,
    away_logo: row.away_team_logo,
    utcDate: row.fixture_date,
    status: row.status_short,
    group_name: row.round,
    league_id: row.league_id,
    score: {
      fullTime: { home: row.home_goals, away: row.away_goals },
    },
  }));

  return NextResponse.json({ matches });
}

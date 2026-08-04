import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'FINISHED':
      return 'finished';
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    default:
      return 'scheduled';
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!FOOTBALL_DATA_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env variables' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const past = new Date();
  past.setDate(past.getDate() - 30);
  const future = new Date();
  future.setDate(future.getDate() + 45);

  const url = `https://api.football-data.org/v4/competitions/BSA/matches?dateFrom=${formatDate(past)}&dateTo=${formatDate(future)}`;

  const response = await fetch(url, {
    headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: 'Failed to fetch from football-data.org', details: text },
      { status: response.status }
    );
  }

  const data = await response.json();
  const matches = data.matches || [];

  const rows = matches.map((m: any) => ({
    api_fixture_id: m.id,
    home_team: m.homeTeam?.shortName || m.homeTeam?.name,
    away_team: m.awayTeam?.shortName || m.awayTeam?.name,
    match_date: m.utcDate,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    status: mapStatus(m.status),
    group_name: m.group ?? null,
  }));

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'api_fixture_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, imported: rows.length });
}

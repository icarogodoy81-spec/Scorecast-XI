import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id);

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const leagueIds = (memberships ?? []).map((m: any) => m.league_id);
  if (leagueIds.length === 0) {
    return NextResponse.json({ competitionCodes: [] });
  }

  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('competition_code')
    .in('id', leagueIds);

  if (leaguesError) {
    return NextResponse.json({ error: leaguesError.message }, { status: 500 });
  }

  const competitionCodes = [...new Set(
    (leagues ?? [])
      .map((l: any) => l.competition_code)
      .filter((code: any) => typeof code === 'string' && code.length > 0)
  )];

  return NextResponse.json({ competitionCodes });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('fixture_id, match_id, home_score, away_score')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      predictions: (data || []).map((row) => ({
        fixture_id: row.fixture_id,
        match_id: row.match_id,
        home_score: row.home_score,
        away_score: row.away_score,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load predictions' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, fixtureId, homeScore, awayScore } = body;
    const apiId = Number(fixtureId ?? matchId);

    if (!apiId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: 'Missing scores' }, { status: 400 });
    }

    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('id, api_fixture_id')
      .eq('api_fixture_id', apiId)
      .single();

    if (fixtureError || !fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    const { error } = await supabase.from('predictions').upsert(
      {
        user_id: user.id,
        fixture_id: fixture.id,
        match_id: fixture.id,
        home_score: Number(homeScore),
        away_score: Number(awayScore),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,fixture_id' },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save prediction' },
      { status: 500 },
    );
  }
}

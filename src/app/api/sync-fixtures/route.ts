import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FOOTBALL_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const leagueId = 2; // Champions League
    const season = 2025; // 2025/26 Champions League season

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Football API request failed", details: data },
        { status: 500 }
      );
    }

    const fixtures = data.response || [];

    const rows = fixtures.map((item: any) => ({
      api_fixture_id: item.fixture.id,
      league_id: item.league.id,
      league_name: item.league.name,
      season: item.league.season,
      round: item.league.round,
      fixture_date: item.fixture.date,
      status_short: item.fixture.status.short,
      status_long: item.fixture.status.long,
      home_team_id: item.teams.home.id,
      home_team_name: item.teams.home.name,
      home_team_logo: item.teams.home.logo,
      away_team_id: item.teams.away.id,
      away_team_name: item.teams.away.name,
      away_team_logo: item.teams.away.logo,
      home_goals: item.goals.home,
      away_goals: item.goals.away,
    }));

    if (rows.length === 0) {
      return NextResponse.json({
        message: "No fixtures returned from API",
        count: 0,
      });
    }

    const { error } = await supabaseAdmin
      .from("fixtures")
      .upsert(rows, {
        onConflict: "api_fixture_id",
      });

    if (error) {
      return NextResponse.json(
        { error: "Supabase insert failed", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Fixtures synced successfully",
      count: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: error.message },
      { status: 500 }
    );
  }
}

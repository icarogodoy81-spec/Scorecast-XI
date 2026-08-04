import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const leagueId = searchParams.get("league");
    const season = searchParams.get("season");

    if (!leagueId || !season) {
      return NextResponse.json(
        { success: false, error: "Missing league or season" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const footballApiKey = process.env.FOOTBALL_API_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    if (!footballApiKey) {
      return NextResponse.json(
        { success: false, error: "Missing FOOTBALL_API_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const apiUrl = new URL("https://v3.football.api-sports.io/fixtures");
    apiUrl.searchParams.set("league", leagueId);
    apiUrl.searchParams.set("season", season);
    apiUrl.searchParams.set("timezone", "Europe/London");

    const apiRes = await fetch(apiUrl.toString(), {
      headers: {
        "x-apisports-key": footballApiKey,
      },
      cache: "no-store",
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Football API error",
          status: apiRes.status,
          details: apiData,
        },
        { status: 500 }
      );
    }

    const responseItems = apiData.response || [];

    const fixtures = responseItems.map((item: any) => ({
      id: item.fixture.id,
      league_id: item.league.id,
      season: item.league.season,
      round: item.league.round,

      home_team_id: item.teams.home.id,
      home_team_name: item.teams.home.name,
      home_team_logo: item.teams.home.logo,

      away_team_id: item.teams.away.id,
      away_team_name: item.teams.away.name,
      away_team_logo: item.teams.away.logo,

      date: item.fixture.date,
      status: item.fixture.status.short,

      home_score: item.goals.home,
      away_score: item.goals.away,

      updated_at: new Date().toISOString(),
    }));

    if (fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        inserted_or_updated: 0,
        message: "No fixtures returned from Football API",
        apiResults: apiData.results,
      });
    }

    const { error } = await supabase
      .from("fixtures")
      .upsert(fixtures, { onConflict: "id" });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase upsert error",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted_or_updated: fixtures.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

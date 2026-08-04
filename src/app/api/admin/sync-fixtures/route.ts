import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const footballDataApiKey =
  process.env.FOOTBALL_DATA_API_KEY ||
  process.env.FOOTBALL_DATA_TOKEN;

const footballDataBaseUrl =
  process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4";

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getApiHeaders() {
  if (!footballDataApiKey) {
    throw new Error(
      "Missing football-data.org API key env var: FOOTBALL_DATA_API_KEY or FOOTBALL_DATA_TOKEN"
    );
  }

  return {
    "X-Auth-Token": footballDataApiKey,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const competition = searchParams.get("competition");
    const seasonParam = searchParams.get("season");

    if (!competition || !seasonParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required query params: competition and season",
        },
        { status: 400 }
      );
    }

    const season = Number(seasonParam);

    if (!Number.isInteger(season)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid season",
        },
        { status: 400 }
      );
    }

    const apiUrl = new URL(
      `/competitions/${competition}/matches`,
      footballDataBaseUrl
    );

    apiUrl.searchParams.set("season", String(season));

    const apiResponse = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: getApiHeaders(),
      cache: "no-store",
    });

    const apiJson = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "football-data.org request failed",
          status: apiResponse.status,
          api: apiJson,
        },
        { status: 502 }
      );
    }

    const matches = Array.isArray(apiJson?.matches) ? apiJson.matches : [];

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        inserted_or_updated: 0,
        message: "No fixtures returned from football-data.org.",
      });
    }

    const rows = matches.map((match: any) => {
      const competitionData = match.competition;
      const homeTeam = match.homeTeam;
      const awayTeam = match.awayTeam;
      const score = match.score;

      const fixtureDate = match.utcDate ? new Date(match.utcDate) : null;

      return {
        api_fixture_id: match.id,

        league_id: competitionData?.id ?? null,
        league_name: competitionData?.name ?? competition,
        season,
        round: match.matchday
          ? `Matchday ${match.matchday}`
          : match.stage ?? null,

        fixture_date: match.utcDate ?? null,
        fixture_timestamp: fixtureDate
          ? Math.floor(fixtureDate.getTime() / 1000)
          : null,
        timezone: "UTC",

        venue_id: null,
        venue_name: null,
        venue_city: null,

        referee: Array.isArray(match.referees)
          ? match.referees.map((ref: any) => ref.name).filter(Boolean).join(", ") || null
          : null,

        status_long: match.status ?? null,
        status_short: match.status ?? null,
        status_elapsed: null,

        home_team_id: homeTeam?.id ?? null,
        home_team_name: homeTeam?.name ?? null,
        home_team_logo: null,

        away_team_id: awayTeam?.id ?? null,
        away_team_name: awayTeam?.name ?? null,
        away_team_logo: null,

        home_goals: score?.fullTime?.home ?? null,
        away_goals: score?.fullTime?.away ?? null,

        halftime_home_goals: score?.halfTime?.home ?? null,
        halftime_away_goals: score?.halfTime?.away ?? null,

        fulltime_home_goals: score?.fullTime?.home ?? null,
        fulltime_away_goals: score?.fullTime?.away ?? null,

        extratime_home_goals: score?.extraTime?.home ?? null,
        extratime_away_goals: score?.extraTime?.away ?? null,

        penalty_home_goals: score?.penalties?.home ?? null,
        penalty_away_goals: score?.penalties?.away ?? null,

        raw_json: match,
        updated_at: new Date().toISOString(),
      };
    });

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("fixtures").upsert(rows, {
      onConflict: "api_fixture_id",
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase upsert failed",
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted_or_updated: rows.length,
      message: "Fixtures synced successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected sync-fixtures error",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

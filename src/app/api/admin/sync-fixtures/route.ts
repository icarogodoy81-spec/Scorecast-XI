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

console.log("KEY LOADED:", !!footballDataApiKey, footballDataApiKey?.length);
console.log("SUPABASE URL LOADED:", !!supabaseUrl);
console.log("SUPABASE SERVICE ROLE KEY LOADED:", !!supabaseServiceRoleKey);

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

function toShortStatus(status: string | null): string {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "NS";
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "FT";
    case "POSTPONED":
      return "PST";
    case "SUSPENDED":
      return "SUSP";
    case "CANCELLED":
      return "CANC";
    case "AWARDED":
      return "AWD";
    default:
      return "NS";
  }
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
      `${footballDataBaseUrl.replace(/\/$/, "")}/competitions/${competition}/matches`
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

      const utcDate = match.utcDate ?? null;

      return {
        api_fixture_id: match.id,
        fixture_id: match.id,
        competition_code: competition,

        league_id: competitionData?.id ?? null,
        league_logo: competitionData?.emblem ?? null,
        league_flag: null,
        season,
        round: match.matchday
          ? `Matchday ${match.matchday}`
          : match.stage ?? null,

        date: utcDate,
        fixture_date: utcDate,
        kickoff_time: utcDate,
        timezone: "UTC",

        venue_name: null,
        venue_city: null,

        status: match.status ?? null,
        status_short: toShortStatus(match.status),
        status_long: match.status ?? null,
        elapsed: null,

        home_team_id: homeTeam?.id ?? null,
        home_team_name: homeTeam?.name ?? null,
        home_team: homeTeam?.name ?? null,
        home_team_logo: homeTeam?.crest ?? null,
        home_logo: homeTeam?.crest ?? null,

        away_team_id: awayTeam?.id ?? null,
        away_team_name: awayTeam?.name ?? null,
        away_team: awayTeam?.name ?? null,
        away_team_logo: awayTeam?.crest ?? null,
        away_logo: awayTeam?.crest ?? null,

        home_goals: score?.fullTime?.home ?? null,
        away_goals: score?.fullTime?.away ?? null,
        home_score: score?.fullTime?.home ?? null,
        away_score: score?.fullTime?.away ?? null,

        extratime_home_goals: score?.extraTime?.home ?? null,
        extratime_away_goals: score?.extraTime?.away ?? null,
        extratime_home_score: score?.extraTime?.home ?? null,
        extratime_away_score: score?.extraTime?.away ?? null,

        penalty_home_goals: score?.penalties?.home ?? null,
        penalty_away_goals: score?.penalties?.away ?? null,
        penalty_home_score: score?.penalties?.home ?? null,
        penalty_away_score: score?.penalties?.away ?? null,

        raw: match,
        updated_at: new Date().toISOString(),
      };
    });

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("fixtures").upsert(rows, {
      onConflict: "api_fixture_id",
    });

    if (error) {
      console.error("SUPABASE UPSERT ERROR:", error);
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
    console.error("SYNC-FIXTURES ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected sync-fixtures error",
        error: error?.message ?? String(error),
        stack: error?.stack ?? null,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set("competition", url.searchParams.get("competition") || "BSA");
  url.searchParams.set("season", url.searchParams.get("season") || "2026");
  const patchedReq = new NextRequest(url, req);
  return POST(patchedReq);
}

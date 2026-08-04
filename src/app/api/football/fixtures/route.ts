// src/app/api/football/fixtures/route.ts

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL = "https://v3.football.api-sports.io";
const CHAMPIONS_LEAGUE_ID = "2";

function jsonUtf8(body: unknown, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const apiKey =
      process.env.FOOTBALL_API_KEY ||
      process.env.APISPORTS_KEY;

    if (!apiKey) {
      return jsonUtf8(
        {
          success: false,
          error: "Missing API-Football API key",
        },
        500
      );
    }

    const season = searchParams.get("season") || "2026";
    const date = searchParams.get("date");
    const timezone = searchParams.get("timezone") || "Europe/London";

    const apiUrl = new URL(`${API_BASE_URL}/fixtures`);

    apiUrl.searchParams.set("league", CHAMPIONS_LEAGUE_ID);
    apiUrl.searchParams.set("season", season);
    apiUrl.searchParams.set("timezone", timezone);

    if (date) {
      apiUrl.searchParams.set("date", date);
    }

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonUtf8(
        {
          success: false,
          error: "API-Football request failed",
          status: response.status,
          details: data,
        },
        response.status
      );
    }

    const fixtures = (data.response || []).map((item: any) => ({
      fixtureId: item.fixture?.id,
      referee: item.fixture?.referee,
      timezone: item.fixture?.timezone,
      date: item.fixture?.date,
      timestamp: item.fixture?.timestamp,
      venue: item.fixture?.venue,
      status: item.fixture?.status,
      league: item.league,
      teams: item.teams,
      goals: item.goals,
      score: item.score,
    }));

    return jsonUtf8({
      success: true,
      league: {
        id: 2,
        name: "UEFA Champions League",
      },
      season,
      date: date || null,
      count: fixtures.length,
      fixtures,
    });
  } catch (error) {
    return jsonUtf8(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      500
    );
  }
}

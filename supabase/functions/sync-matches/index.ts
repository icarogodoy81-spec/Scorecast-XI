import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, message: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const { league, season } = await req.json();

    if (!league || !season) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing league or season",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const footballApiKey = Deno.env.get("FOOTBALL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!footballApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing environment variables",
          env: {
            FOOTBALL_API_KEY: Boolean(footballApiKey),
            SUPABASE_URL: Boolean(supabaseUrl),
            SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRoleKey),
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const apiUrl = `https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}`;

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-apisports-key": footballApiKey,
      },
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Football API request failed",
          status: apiResponse.status,
          apiData,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (apiData.errors && Object.keys(apiData.errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Football API returned errors",
          errors: apiData.errors,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const fixtures = apiData.response ?? [];

    if (fixtures.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          inserted: 0,
          message: "No fixtures found",
          league,
          season,
          apiResults: apiData.results,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const matches = fixtures.map((item: any) => ({
      api_fixture_id: item.fixture.id,
      league_id: item.league.id,
      league_name: item.league.name,
      season: item.league.season,
      round: item.league.round,
      match_date: item.fixture.date,
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

    const { error } = await supabase
      .from("matches")
      .upsert(matches, {
        onConflict: "api_fixture_id",
      });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase insert failed",
          error,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: matches.length,
        message: "Fixtures synced",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unexpected function error",
        error: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

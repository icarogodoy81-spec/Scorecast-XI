import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case "FINISHED":
      return "finished";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "SCHEDULED":
    case "TIMED":
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
    default:
      return "scheduled";
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, message: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const { competition } = await req.json(); // e.g. "BSA", "PL", "PD"

    if (!competition) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing competition code" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const footballApiKey = Deno.env.get("FOOTBALL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!footballApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const apiUrl = `https://api.football-data.org/v4/competitions/${competition}/matches`;

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: { "X-Auth-Token": footballApiKey },
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Football-data.org API request failed",
          status: apiResponse.status,
          apiData,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const fixtures = apiData.matches ?? [];

    if (fixtures.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: "No fixtures found", competition }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const matches = fixtures.map((item: any) => ({
      api_fixture_id: item.id,
      home_team: item.homeTeam.name,
      away_team: item.awayTeam.name,
      match_date: item.utcDate,
      home_score: item.score.fullTime.home,
      away_score: item.score.fullTime.away,
      status: mapStatus(item.status),
      group_name: item.stage ?? null,
    }));

    const { error } = await supabase
      .from("matches")
      .upsert(matches, { onConflict: "api_fixture_id" });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: "Supabase insert failed", error }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, inserted: matches.length, message: "Fixtures synced", competition }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Unexpected function error", error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

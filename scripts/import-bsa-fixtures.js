require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_TOKEN = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION = "BSA";
const SEASON = 2026;

function mapStatus(apiStatus) {
  switch (apiStatus) {
    case "SCHEDULED":
    case "TIMED":
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "scheduled";
    case "IN_PLAY":
    case "PAUSED":
    case "EXTRA_TIME":
    case "PENALTY_SHOOTOUT":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    default:
      return "scheduled";
  }
}

async function fetchFixtures() {
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/matches?season=${SEASON}`,
    { headers: { "X-Auth-Token": API_TOKEN } }
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.matches;
}

async function main() {
  const fixtures = await fetchFixtures();

  const rows = fixtures.map((f) => ({
    home_team: f.homeTeam.name,
    away_team: f.awayTeam.name,
    match_date: f.utcDate,
    home_score: f.score?.fullTime?.home ?? null,
    away_score: f.score?.fullTime?.away ?? null,
    group_name: f.group ?? null,
    status: mapStatus(f.status),
    api_fixture_id: f.id,
  }));

  console.log(`Fetched ${rows.length} fixtures from API.`);

  const { data, error } = await supabase.from("matches").insert(rows).select("id");

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} matches.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

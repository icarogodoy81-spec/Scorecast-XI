require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_TOKEN = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION = "BSA";
const SEASON = 2026;

function normalize(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
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
  const { data: dbMatches, error } = await supabase
    .from("matches")
    .select("id, home_team, away_team, match_date, api_fixture_id");

  if (error) throw error;

  const fixtures = await fetchFixtures();

  const unmatched = [];
  let updatedCount = 0;

  for (const m of dbMatches) {
    if (m.api_fixture_id) continue;

    const dbDate = new Date(m.match_date).toISOString().slice(0, 10);
    const dbHome = normalize(m.home_team);
    const dbAway = normalize(m.away_team);

    const match = fixtures.find((f) => {
      const fDate = f.utcDate.slice(0, 10);
      const fHome = normalize(f.homeTeam.name);
      const fAway = normalize(f.awayTeam.name);
      return fDate === dbDate && fHome === dbHome && fAway === dbAway;
    });

    if (!match) {
      unmatched.push({ id: m.id, home: m.home_team, away: m.away_team, date: dbDate });
      continue;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update({ api_fixture_id: match.id })
      .eq("id", m.id);

    if (updateError) {
      console.error(`Failed to update match ${m.id}:`, updateError.message);
    } else {
      updatedCount++;
    }
  }

  console.log(`Updated: ${updatedCount}`);
  console.log(`Unmatched (${unmatched.length}):`);
  console.table(unmatched);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

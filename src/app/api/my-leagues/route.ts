import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  const leagueIds = (memberships ?? []).map((m) => m.league_id);

  if (leagueIds.length === 0) {
    return NextResponse.json({ leagues: [], competitionCodes: [] });
  }

  const { data: leagues, error: leaguesError } = await supabase
    .from("leagues")
    .select("id, name, competition_code")
    .in("id", leagueIds);

  if (leaguesError) {
    return NextResponse.json({ error: leaguesError.message }, { status: 500 });
  }

  const { data: competitionRows, error: competitionsError } = await supabase
    .from("league_competitions")
    .select("league_id, competition_code")
    .in("league_id", leagueIds);

  if (competitionsError) {
    return NextResponse.json({ error: competitionsError.message }, { status: 500 });
  }

  const competitionsByLeague = new Map<number, string[]>();

  for (const row of competitionRows ?? []) {
    const list = competitionsByLeague.get(row.league_id) ?? [];
    list.push(row.competition_code);
    competitionsByLeague.set(row.league_id, list);
  }

  const leagueObjects = (leagues ?? []).map((league) => {
    const codes = [
      ...(competitionsByLeague.get(league.id) ?? []),
      ...(league.competition_code ? [league.competition_code] : []),
    ];

    const competitionCodes = [
      ...new Set(
        codes
          .filter(
            (code): code is string =>
              typeof code === "string" && code.trim().length > 0
          )
          .map((code) => code.trim().toUpperCase())
      ),
    ];

    return { id: league.id, name: league.name, competitionCodes };
  });

  const competitionCodes = [
    ...new Set(leagueObjects.flatMap((league) => league.competitionCodes)),
  ];

  return NextResponse.json({ leagues: leagueObjects, competitionCodes });
}

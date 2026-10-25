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

  const leagueIds = (memberships ?? []).map((membership) => membership.league_id);

  if (leagueIds.length === 0) {
    return NextResponse.json({ competitionCodes: [] });
  }

  const [competitionsResult, leaguesResult] = await Promise.all([
    supabase
      .from("league_competitions")
      .select("competition_code")
      .in("league_id", leagueIds),
    supabase
      .from("leagues")
      .select("competition_code")
      .in("id", leagueIds),
  ]);

  if (competitionsResult.error) {
    return NextResponse.json(
      { error: competitionsResult.error.message },
      { status: 500 }
    );
  }

  if (leaguesResult.error) {
    return NextResponse.json(
      { error: leaguesResult.error.message },
      { status: 500 }
    );
  }

  const competitionCodes = [
    ...new Set(
      [
        ...(competitionsResult.data ?? []).map((row) => row.competition_code),
        ...(leaguesResult.data ?? []).map((league) => league.competition_code),
      ]
        .filter(
          (code): code is string =>
            typeof code === "string" && code.trim().length > 0
        )
        .map((code) => code.trim().toUpperCase())
    ),
  ];

  return NextResponse.json({ competitionCodes });
}

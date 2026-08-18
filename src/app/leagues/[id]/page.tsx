import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LeagueStandings from "./LeagueStandings";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

const THEME = {
  darkBlue: "#0f172a",
  mutedText: "#cbd5e1",
  accent: "#93c5fd",
  green: "#4ade80",
};

const VISIBLE_STATUSES = [
  "FT", "FINISHED", "AET", "PEN",
  "LIVE", "IN_PLAY", "1H", "2H", "HT", "PAUSED",
];

const POINTS_EXACT = 4;
const POINTS_GOAL_DIFF = 3;
const POINTS_RESULT = 2;

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .single();

  if (!league) {
    return (
      <>
        <Navbar />
        <div
          style={{ background: THEME.darkBlue, minHeight: "100vh", color: THEME.mutedText }}
          className="flex items-center justify-center"
        >
          League not found.
        </div>
      </>
    );
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <>
        <Navbar />
        <div
          style={{ background: THEME.darkBlue, minHeight: "100vh", color: THEME.mutedText }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <p>You&apos;re not a member of this league.</p>
          <Link href="/leagues" style={{ color: THEME.green }} className="hover:underline">
            Back to leagues
          </Link>
        </div>
      </>
    );
  }

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, username)")
    .eq("league_id", leagueId);

  const userIds = (members || []).map((m: any) => m.user_id);
  if (userIds.length === 0) {
    return (
      <>
        <Navbar />
        <div
          style={{ background: THEME.darkBlue, minHeight: "100vh", color: THEME.mutedText }}
          className="flex items-center justify-center"
        >
          No members yet.
        </div>
      </>
    );
  }

  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      "id, user_id, home_score, away_score, actual_home_score, actual_away_score, points, match_id"
    )
    .in("user_id", userIds);

  const fixtureIds = [...new Set((predictions || []).map((p: any) => p.match_id))];

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("id, api_fixture_id, home_team_name, away_team_name, home_score, away_score, competition_code")
    .in("id", fixtureIds);

  const fixturesById = new Map((fixtures || []).map((f: any) => [f.id, f]));

  const apiFixtureIds = [...new Set((fixtures || []).map((f: any) => f.api_fixture_id).filter(Boolean))];

  const { data: matches } = await supabase
    .from("matches")
    .select("api_fixture_id, home_team, away_team, match_date, status, home_score, away_score")
    .in("api_fixture_id", apiFixtureIds);

  const matchesByApiId = new Map((matches || []).map((m: any) => [m.api_fixture_id, m]));

  // Derive the competition code the leaderboard is actually scoring on:
  // prefer the league's own field, otherwise take it from the fixtures its
  // predictions point at, so the button always opens the right league.
  const leagueCompetitionCode =
    league.competition_code ||
    (fixtures || []).map((f: any) => f.competition_code).find((c: any) => c) ||
    null;

  const now = new Date();

  const standings = (members || []).map((m: any) => {
    const username = m.profiles?.username || "Unknown";
    const userPreds = (predictions || []).filter((p: any) => p.user_id === m.user_id);

    let totalPoints = 0;
    let exactScores = 0;
    let goalDiff = 0;
    let correctResult = 0;

    const detailedPredictions = userPreds
      .filter((p: any) => {
        const fixture = fixturesById.get(p.match_id);
        if (!fixture) return false;
        const match = matchesByApiId.get(fixture.api_fixture_id);
        const kickoff = match?.match_date ? new Date(match.match_date) : null;
        const statusUpper = (match?.status || "").toUpperCase();
        const hasScores = fixture.home_score !== null && fixture.home_score !== undefined && fixture.away_score !== null && fixture.away_score !== undefined;
        const started = (kickoff && kickoff <= now) || VISIBLE_STATUSES.includes(statusUpper) || hasScores;
        return started;
      })
      .map((p: any) => {
        const fixture = fixturesById.get(p.match_id);
        const match = matchesByApiId.get(fixture?.api_fixture_id);

        const actH = fixture?.home_score ?? match?.home_score ?? p.actual_home_score;
        const actA = fixture?.away_score ?? match?.away_score ?? p.actual_away_score;
        const predH = p.home_score;
        const predA = p.away_score;

        let outcome = "";
        let predPoints = 0;

        if (actH !== null && actH !== undefined && actA !== null && actA !== undefined) {
          if (predH === actH && predA === actA) {
            exactScores++;
            outcome = "Exact Score";
            predPoints = POINTS_EXACT;
          } else if (actH !== actA && predH - predA === actH - actA) {
            goalDiff++;
            outcome = "Correct Goal Difference";
            predPoints = POINTS_GOAL_DIFF;
          } else {
            const predResult = predH > predA ? "H" : predH < predA ? "A" : "D";
            const actResult = actH > actA ? "H" : actH < actA ? "A" : "D";
            if (predResult === actResult) {
              correctResult++;
              outcome = "Correct Result";
              predPoints = POINTS_RESULT;
            } else {
              outcome = "Incorrect";
            }
          }
        }

        totalPoints += predPoints;

        return {
          matchId: p.match_id,
          homeTeam: fixture?.home_team_name || match?.home_team || "?",
          awayTeam: fixture?.away_team_name || match?.away_team || "?",
          matchDate: match?.match_date,
          predictedHome: predH,
          predictedAway: predA,
          actualHome: actH,
          actualAway: actA,
          points: predPoints,
          outcome,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );

    return {
      userId: m.user_id,
      username,
      points: totalPoints,
      exactScores,
      goalDiff,
      correctResult,
      predictions: detailedPredictions,
    };
  });

  standings.sort((a, b) => b.points - a.points);

  return (
    <>
      <Navbar />
      <div style={{ background: THEME.darkBlue, minHeight: "100vh", color: "#f8fafc" }} className="px-4 py-8 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{league.name}</h1>
            <p style={{ color: THEME.mutedText }} className="text-sm mt-1">
              Invite code:{" "}
              <span className="font-mono font-bold" style={{ color: THEME.accent }}>
                {league.invite_code}
              </span>
            </p>

            <Link
              href={
                leagueCompetitionCode
                  ? `/predictions?competition_code=${leagueCompetitionCode}`
                  : "/predictions"
              }
              className="inline-block mt-4 px-5 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: THEME.green, color: "#0f172a" }}
            >
              Make predictions
            </Link>
          </div>

          <LeagueStandings standings={standings} currentUserId={user.id} />
        </div>
      </div>
    </>
  );
}

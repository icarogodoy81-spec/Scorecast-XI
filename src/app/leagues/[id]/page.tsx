import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LeagueStandings from "./LeagueStandings";

export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const leagueId = params.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .single();

  if (!league) {
    return <div className="text-center py-12 text-gray-400">League not found.</div>;
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">You&apos;re not a member of this league.</p>
        <Link href="/leagues" className="text-green-600 hover:underline">
          Back to leagues
        </Link>
      </div>
    );
  }

  // All members of this league
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, username)")
    .eq("league_id", leagueId);

  const userIds = (members || []).map((m: any) => m.user_id);
  if (userIds.length === 0) {
    return <div className="text-center py-12 text-gray-400">No members yet.</div>;
  }

  // All predictions for these users, joined with match info
  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      "id, user_id, home_score, away_score, actual_home_score, actual_away_score, points, match_status, match_id, matches(home_team, away_team, match_date)"
    )
    .in("user_id", userIds);

  const standings = (members || []).map((m: any) => {
    const username = m.profiles?.username || "Unknown";
    const userPreds = (predictions || []).filter((p: any) => p.user_id === m.user_id);

    let points = 0;
    let exactScores = 0;
    let goalDiff = 0;
    let correctResult = 0;

    const detailedPredictions = userPreds
      .filter((p: any) => p.match_status === "FINISHED")
      .map((p: any) => {
        points += Number(p.points) || 0;

        const predH = p.home_score;
        const predA = p.away_score;
        const actH = p.actual_home_score;
        const actA = p.actual_away_score;

        let outcome = "";

        if (predH === actH && predA === actA) {
          exactScores++;
          outcome = "Exact Score";
        } else if (predH - predA === actH - actA) {
          goalDiff++;
          outcome = "Correct Goal Difference";
        } else {
          const predResult = predH > predA ? "H" : predH < predA ? "A" : "D";
          const actResult = actH > actA ? "H" : actH < actA ? "A" : "D";
          if (predResult === actResult) {
            correctResult++;
            outcome = "Correct Result";
          } else {
            outcome = "Incorrect";
          }
        }

        return {
          matchId: p.match_id,
          homeTeam: p.matches?.home_team || "?",
          awayTeam: p.matches?.away_team || "?",
          matchDate: p.matches?.match_date,
          predictedHome: predH,
          predictedAway: predA,
          actualHome: actH,
          actualAway: actA,
          points: Number(p.points) || 0,
          outcome,
        };
      })
      .sort((a: any, b: any) =>
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );

    return {
      userId: m.user_id,
      username,
      points,
      exactScores,
      goalDiff,
      correctResult,
      predictions: detailedPredictions,
    };
  });

  standings.sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Invite code: <span className="font-mono font-bold">{league.invite_code}</span>
        </p>
      </div>

      <LeagueStandings standings={standings} currentUserId={user.id} />
    </div>
  );
}

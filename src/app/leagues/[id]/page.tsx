import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getLeagueStandings(supabase: any, leagueId: string) {
  // Get all members with their user info
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, users:profiles(id, username)")
    .eq("league_id", leagueId);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m: any) => m.user_id);

  // Get scored predictions for these users (points already calculated on match finish)
  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points")
    .in("user_id", userIds);

  // Calculate points per user
  const points: Record<string, number> = {};
  userIds.forEach((id: string) => (points[id] = 0));

  predictions?.forEach((p: any) => {
    points[p.user_id] += Number(p.points) || 0;
  });

  return members
    .map((m: any) => ({
      userId: m.user_id,
      username: m.users?.username || "Unknown",
      points: points[m.user_id] || 0,
    }))
    .sort((a: { points: number }, b: { points: number }) => b.points - a.points);
}

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

  // Check membership
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

  const standings = await getLeagueStandings(supabase, leagueId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Invite code: <span className="font-mono font-bold">{league.invite_code}</span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Standings ({standings.length} players)
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
         {standings.map((s: { userId: string; username: string; points: number }, i: number) => (
            <div
              key={s.userId}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 text-center ${
                  i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-300"
                }`}>
                  {i + 1}
                </span>
                <span className={`text-sm ${s.userId === user.id ? "font-bold" : "font-medium"}`}>
                  {s.username}
                  {s.userId === user.id && (
                    <span className="text-xs text-green-600 ml-1">(you)</span>
                  )}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-700">{s.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

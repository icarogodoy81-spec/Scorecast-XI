import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name)")
    .eq("user_id", user!.id);

  const leagues = (memberships || [])
    .map((m: any) => m.leagues)
    .filter(Boolean);

  if (leagues.length === 0) {
    redirect("/leagues");
  }

  if (leagues.length === 1) {
    redirect(`/leagues/${leagues[0].id}`);
  }

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto px-4 pb-12 pt-6">
        <Link
          href="/dashboard"
          className="inline-block mb-6 text-sm text-slate-400 hover:text-green-400 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-white">Choose a league</h1>
        <div className="flex flex-col gap-3">
          {leagues.map((league: any) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="block px-4 py-4 rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-green-500/50 hover:bg-slate-800/60 transition-all text-center font-medium text-slate-100 shadow-lg"
            >
              {league.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

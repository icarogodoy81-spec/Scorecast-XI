"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createLeague, joinLeague } from "@/app/actions/leagues";

type League = {
  id: string | number;
  name: string;
  invite_code: string;
  owner_id: string;
  competition_code: string | null;
};

const COMPETITIONS = [
  { code: "WC", name: "FIFA World Cup" },
  { code: "CL", name: "UEFA Champions League" },
  { code: "BL1", name: "Bundesliga" },
  { code: "DED", name: "Eredivisie" },
  { code: "BSA", name: "Campeonato Brasileiro Série A" },
  { code: "PD", name: "Primera Division" },
  { code: "FL1", name: "Ligue 1" },
  { code: "ELC", name: "Championship" },
  { code: "PPL", name: "Primeira Liga" },
  { code: "EC", name: "European Championship" },
  { code: "SA", name: "Serie A" },
  { code: "PL", name: "Premier League" },
];

export default function LeaguesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueCompetition, setNewLeagueCompetition] = useState("BSA");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLeagues() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const uid = user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", uid);

      if (membershipError) {
        setMessage("Could not load your leagues. Please refresh the page.");
        setLoading(false);
        return;
      }

      const leagueIds = (memberships ?? []).map(
        (membership: { league_id: string | number }) => membership.league_id
      );

      if (leagueIds.length > 0) {
        const { data: leagues, error: leaguesError } = await supabase
          .from("leagues")
          .select("id, name, invite_code, owner_id, competition_code")
          .in("id", leagueIds);

        if (leaguesError) {
          setMessage("Could not load your leagues. Please refresh the page.");
        } else {
          setMyLeagues((leagues ?? []) as League[]);
        }
      }

      setLoading(false);
    }

    loadLeagues();
  }, [supabase]);

  async function handleCreate() {
    const name = newLeagueName.trim();

    if (!userId || !name || isSubmitting) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await createLeague({
        name,
        competition_code: newLeagueCompetition,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (!("data" in result) || !result.data) {
        setMessage("Could not create the league. Please try again.");
        return;
      }

      const league = result.data as League;
      setMyLeagues((previous) => [...previous, league]);
      setNewLeagueName("");
      setMessage(`League created! Invite code: ${league.invite_code}`);
    } catch {
      setMessage("Could not create the league. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim();

    if (!userId || !code || isSubmitting) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await joinLeague(code);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (!("data" in result) || !result.data) {
        setMessage("Could not join the league. Please try again.");
        return;
      }

      const league = result.data as League;
      setMyLeagues((previous) => [...previous, league]);
      setJoinCode("");
      setMessage(`Joined ${league.name}!`);
    } catch {
      setMessage("Could not join the league. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-6 text-slate-100 md:p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Scorecast XI"
            width={443}
            height={319}
            className="h-auto w-full max-w-[280px]"
            priority
          />
        </div>

        <Link
          href="/dashboard"
          className="inline-block text-slate-400 transition-colors hover:text-blue-400"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white">Private Leagues</h1>

        {loading ? (
          <p className="text-blue-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Create a league
              </h2>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={newLeagueName}
                  onChange={(event) => setNewLeagueName(event.target.value)}
                  placeholder="League name"
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />

                <select
                  value={newLeagueCompetition}
                  onChange={(event) =>
                    setNewLeagueCompetition(event.target.value)
                  }
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                >
                  {COMPETITIONS.map((competition) => (
                    <option
                      key={competition.code}
                      value={competition.code}
                      className="bg-slate-800"
                    >
                      {competition.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleCreate}
                  disabled={isSubmitting || !newLeagueName.trim()}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Please wait..." : "Create"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Join a league
              </h2>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Invite code"
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />

                <button
                  onClick={handleJoin}
                  disabled={isSubmitting || !joinCode.trim()}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Please wait..." : "Join"}
                </button>
              </div>
            </section>

            {message && (
              <p className="px-2 font-medium text-yellow-400" role="status">
                {message}
              </p>
            )}

            <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
              <h2 className="mb-4 text-xl font-semibold text-white">
                My leagues
              </h2>

              {myLeagues.length === 0 ? (
                <p className="text-slate-400">No leagues yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myLeagues.map((league) => (
                    <li
                      key={league.id}
                      className="rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <Link
                        href={`/leagues/${league.id}`}
                        className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                      >
                        <div>
                          <strong className="block text-lg text-blue-400">
                            {league.name}
                          </strong>
                          <span className="text-sm text-slate-400">
                            {league.competition_code ?? "No competition"}
                          </span>
                        </div>

                        <div className="rounded-md bg-black/30 px-3 py-1.5 font-mono text-sm text-slate-300">
                          code:{" "}
                          <span className="text-white">
                            {league.invite_code}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

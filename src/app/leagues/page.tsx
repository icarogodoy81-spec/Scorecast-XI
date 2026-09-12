"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/inviteCode";

type League = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  competition_code: string;
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
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueCompetition, setNewLeagueCompetition] = useState("BSA");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        return;
      }

      const { data: memberships } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", uid);

      const leagueIds = (memberships || []).map((m: { league_id: string }) => m.league_id);

      if (leagueIds.length > 0) {
        const { data: leagues } = await supabase
          .from("leagues")
          .select("id, name, invite_code, owner_id, competition_code")
          .in("id", leagueIds);

        setMyLeagues(leagues || []);
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

  async function handleCreate() {
    if (!userId || !newLeagueName.trim()) return;

    setMessage("");
    const invite_code = generateInviteCode();

    const { data: league, error } = await supabase
      .from("leagues")
      .insert({
        name: newLeagueName.trim(),
        invite_code,
        owner_id: userId,
        competition_code: newLeagueCompetition,
      })
      .select()
      .single();

    if (error || !league) {
      setMessage("Failed to create league.");
      return;
    }

    await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: userId });

    setMyLeagues((prev) => [...prev, league]);
    setNewLeagueName("");
    setMessage(`League created! Invite code: ${league.invite_code}`);
  }

  async function handleJoin() {
    if (!userId || !joinCode.trim()) return;

    setMessage("");

    const { data: league, error } = await supabase
      .from("leagues")
      .select("id, name, invite_code, owner_id, competition_code")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();

    if (error || !league) {
      setMessage("Invalid invite code.");
      return;
    }

    const alreadyMember = myLeagues.some((l) => l.id === league.id);
    if (alreadyMember) {
      setMessage("You're already in this league.");
      return;
    }

    const { error: joinError } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: userId });

    if (joinError) {
      setMessage("Failed to join league.");
      return;
    }

    setMyLeagues((prev) => [...prev, league]);
    setJoinCode("");
    setMessage(`Joined ${league.name}!`);
  }

  return (
    <main className="min-h-screen text-slate-100 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center mb-6">
          <Image 
            src="/images/logo.png" 
            alt="Scorecast XI" 
            width={443} 
            height={319} 
            className="w-full max-w-[280px] h-auto"
            priority
          />
        </div>

        <Link 
          href="/dashboard" 
          className="inline-block text-slate-400 hover:text-blue-400 transition-colors"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white">Private Leagues</h1>

        {loading ? (
          <p className="text-blue-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            
            {/* Create League Section */}
            <section className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-white">Create a league</h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="League name"
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
                <select
                  value={newLeagueCompetition}
                  onChange={(e) => setNewLeagueCompetition(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {COMPETITIONS.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-800">
                      {c.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleCreate} 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-6 py-2.5 transition-colors"
                >
                  Create
                </button>
              </div>
            </section>

            {/* Join League Section */}
            <section className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-white">Join a league</h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Invite code"
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleJoin} 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-6 py-2.5 transition-colors"
                >
                  Join
                </button>
              </div>
            </section>

            {message && (
              <p className="text-yellow-400 font-medium px-2">{message}</p>
            )}

            {/* My Leagues Section */}
            <section className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-white">My leagues</h2>
              {myLeagues.length === 0 ? (
                <p className="text-slate-400">No leagues yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myLeagues.map((l) => (
                    <li key={l.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                      <Link href={`/leagues/${l.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-blue-400 text-lg block">{l.name}</strong>
                          <span className="text-sm text-slate-400">{l.competition_code}</span>
                        </div>
                        <div className="text-sm bg-black/30 px-3 py-1.5 rounded-md font-mono text-slate-300">
                          code: <span className="text-white">{l.invite_code}</span>
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

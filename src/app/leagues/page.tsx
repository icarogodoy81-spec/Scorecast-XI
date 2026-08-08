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

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: 8,
    marginRight: 10,
    background: "#111c34",
    border: "1px solid #243b63",
    color: "#f8fafc",
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: 8,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: 40 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <Image src="/images/logo.png" alt="Scorecast XI" width={443} height={319} />
        </div>

        <Link href="/dashboard" style={{ color: "#93c5fd" }}>
          &larr; Back to dashboard
        </Link>

        <h1 style={{ marginTop: 20 }}>Private Leagues</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <section style={{ marginTop: 30 }}>
              <h2>Create a league</h2>
              <input
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="League name"
                style={inputStyle}
              />
              <select
                value={newLeagueCompetition}
                onChange={(e) => setNewLeagueCompetition(e.target.value)}
                style={inputStyle}
              >
                {COMPETITIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={handleCreate} style={buttonStyle}>
                Create
              </button>
            </section>

            <section style={{ marginTop: 30 }}>
              <h2>Join a league</h2>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Invite code"
                style={inputStyle}
              />
              <button onClick={handleJoin} style={buttonStyle}>
                Join
              </button>
            </section>

            {message && <p style={{ marginTop: 20, color: "#fde047" }}>{message}</p>}

            <section style={{ marginTop: 30 }}>
              <h2>My leagues</h2>
              {myLeagues.length === 0 ? (
                <p>No leagues yet.</p>
              ) : (
                <ul>
                  {myLeagues.map((l) => (
                    <li key={l.id} style={{ marginBottom: 10 }}>
                      <Link href={`/leagues/${l.id}`} style={{ color: "#93c5fd" }}>
                        <strong>{l.name}</strong> ({l.competition_code}) — code: <code>{l.invite_code}</code>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

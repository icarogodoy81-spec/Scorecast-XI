import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function getLeaderboardRows(leagueId?: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  let memberIds: string[] = [];
  let members: any[] = [];

  if (leagueId) {
    const membersResponse = await supabaseAdmin
      .from("league_members")
      .select("user_id, profiles(id, username)")
      .eq("league_id", leagueId);

    if (membersResponse.error) {
      throw new Error(membersResponse.error.message);
    }

    members = membersResponse.data ?? [];
    memberIds = members.map((m) => m.user_id);
  } else {
    const profilesResponse = await supabaseAdmin
      .from("profiles")
      .select("id, username");

    if (profilesResponse.error) {
      throw new Error(profilesResponse.error.message);
    }

    members = (profilesResponse.data ?? []).map((p) => ({
      user_id: p.id,
      profiles: p,
    }));
    memberIds = members.map((m) => m.user_id);
  }

  const predictionsResponse = await supabaseAdmin
    .from("predictions")
    .select("user_id, points")
    .in("user_id", memberIds.length > 0 ? memberIds : ["__none__"]);

  if (predictionsResponse.error) {
    throw new Error(predictionsResponse.error.message);
  }

  const predictions = predictionsResponse.data ?? [];

  const leaderboardByUser = new Map();

  for (const member of members) {
    const profile = (member as any).profiles;
    leaderboardByUser.set(member.user_id, {
      userId: member.user_id,
      username: profile?.username ?? member.user_id,
      points: 0,
      exactScores: 0,
      goalDifference: 0,
      correctResults: 0,
    });
  }

  for (const prediction of predictions) {
    const row = leaderboardByUser.get(prediction.user_id);
    if (!row) continue;
    const points = Number(prediction.points) || 0;
    row.points += points;
    if (points === 4) row.exactScores += 1;
    else if (points === 3) row.goalDifference += 1;
    else if (points === 2) row.correctResults += 1;
  }

  return Array.from(leaderboardByUser.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.correctResults - a.correctResults;
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}


export default async function LeaderboardPage() {
  let rows: any[] = [];
  let errorMessage = "";

  try {
    rows = await getLeaderboardRows();
  } catch (error: any) {
    errorMessage = error.message;
  }

  return (
    <main className="leaderboard-page">
      <div className="bgGrid" />
      <div className="overlay" />

      <div className="shell">
        <header className="top-header">
          <div className="brand">
            <Image src="/images/logo.png" alt="Scorecast XI" width={443} height={319} className="logo" priority />
            <p className="tagline">Scorecast XI standings</p>
          </div>
        </header>

        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/predictions">Make predictions</Link>
          <Link href="/leaderboard" className="active">
            Leaderboard
          </Link>
          <Link href="/profile">Profile</Link>
        </nav>

        <section className="card">
          <div className="row header-row">
            <div>Rank</div>
            <div>Player</div>
            <div>Points</div>
            <div>Exact scores</div>
            <div>Goal difference</div>
            <div>Correct results</div>
          </div>

          <div className="rows">
            {errorMessage ? (
              <div className="empty">Leaderboard error: {errorMessage}</div>
            ) : rows.length === 0 ? (
              <div className="empty">No scored predictions yet.</div>
            ) : (
              rows.map((player) => (
                <div
                  key={player.userId}
                  className={`row player-row ${player.rank === 1 ? "top" : ""}`}
                >
                  <div className={`rank-badge ${player.rank === 1 ? "gold" : ""}`}>
                    {player.rank}
                  </div>

                  <Link href={`/leaderboard/${player.userId}`} className="player-name">
                    {player.username}
                  </Link>

                  <div className="points-cell">{player.points}</div>
                  <div className="normal-cell">{player.exactScores}</div>
                  <div className="normal-cell">{player.goalDifference}</div>
                  <div className="normal-cell">{player.correctResults}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .leaderboard-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #020617 0%, #082f49 45%, #0f172a 100%);
          padding: 40px 20px;
        }

        .bgGrid {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          opacity: 0.25;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.35), transparent 30%),
            radial-gradient(circle at bottom right, rgba(250, 204, 21, 0.18), transparent 30%);
        }

        .shell {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
          background: rgba(2, 6, 23, 0.78);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 24px;
          padding: 32px;
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .brand .logo {
          height: 70px;
          width: auto;
        }

        .brand .tagline {
          margin: 0;
          color: #bfdbfe;
          font-size: 14px;
        }

        .nav {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .nav a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 130px;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.35);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
        }

        .nav a:hover,
        .nav a.active {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.22);
        }

        .card {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 18px;
          padding: 20px;
        }

        .row {
          display: grid;
          grid-template-columns: 60px 1fr 100px 130px 150px 140px;
          gap: 12px;
          align-items: center;
        }

        .header-row {
          padding: 14px 12px;
          background: rgba(2, 6, 23, 0.9);
          border-radius: 12px;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .rows {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .player-row {
          padding: 16px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(147, 197, 253, 0.2);
        }

        .player-row.top {
          background: linear-gradient(90deg, rgba(250, 204, 21, 0.15), rgba(255, 255, 255, 0.04));
          border-color: rgba(250, 204, 21, 0.4);
        }

        .rank-badge {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #cbd5e1;
          color: #071226;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 16px;
        }

        .rank-badge.gold {
          background: #facc15;
        }

        .player-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
          cursor: pointer;
        }

        .player-name:hover {
          text-decoration: underline;
          color: #7dd3fc;
        }

        .points-cell {
          font-size: 24px;
          font-weight: 900;
          color: #7dd3fc;
        }

        .normal-cell {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }

        .empty {
          padding: 18px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(147, 197, 253, 0.2);
          color: #fff;
          font-weight: 800;
        }

        @media (max-width: 800px) {
          .shell {
            padding: 20px 16px;
          }

          .row {
            grid-template-columns: 44px 1fr 60px;
            gap: 8px;
            font-size: 12px;
          }

          .header-row > div:nth-child(4),
          .header-row > div:nth-child(5),
          .header-row > div:nth-child(6),
          .player-row .normal-cell {
            display: none;
          }

          .points-cell {
            font-size: 18px;
            text-align: right;
          }

          .player-name {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}

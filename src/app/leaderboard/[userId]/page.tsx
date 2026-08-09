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

async function getPlayerData(userId: string) {
  const profileResponse = await supabaseAdmin
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .single();

  if (profileResponse.error) {
    throw new Error(profileResponse.error.message);
  }

  const predictionsResponse = await supabaseAdmin
    .from("predictions")
    .select("match_id, home_score, away_score, points, actual_home_score, actual_away_score")
    .eq("user_id", userId);

  if (predictionsResponse.error) {
    throw new Error(predictionsResponse.error.message);
  }

  const predictions = predictionsResponse.data ?? [];
  const matchIds = predictions.map((p) => p.match_id).filter((id) => id !== null);

  let matches: any[] = [];

  if (matchIds.length > 0) {const matchesResponse = await supabaseAdmin
  .from("fixtures")
  .select("id, home_team, away_team, match_date, home_score, away_score, status")
  .in("id", matchIds);

 if (matchesResponse.error) {
      throw new Error(matchesResponse.error.message);
    }

    matches = matchesResponse.data ?? [];
  }

  const matchesById = new Map(matches.map((m) => [m.id, m]));
  const now = new Date();

  const visiblePredictions = predictions
    .map((prediction) => {
      const match = matchesById.get(prediction.match_id);
      if (!match) return null;

      const kickoff = new Date(match.match_date);
      const statusUpper = (match.status || "").toUpperCase();
      const finishedOrLiveStatuses = [
        "IN_PLAY",
        "PAUSED",
        "FINISHED",
        "LIVE",
        "FT",
        "AET",
        "PEN",
        "COMPLETED",
      ];
      const started = kickoff <= now || finishedOrLiveStatuses.includes(statusUpper);

      if (!started) return null;

      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        matchDate: match.match_date,
        status: match.status,
        actualHome: match.home_score ?? prediction.actual_home_score,
        actualAway: match.away_score ?? prediction.actual_away_score,
        guessHome: prediction.home_score,
        guessAway: prediction.away_score,
        points: prediction.points,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const totalPoints = visiblePredictions.reduce((sum, p) => sum + (Number(p.points) || 0), 0);

  return {
    username: profileResponse.data.username ?? profileResponse.data.id,
    predictions: visiblePredictions,
    totalPoints,
  };
}

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default async function PlayerPredictionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let username = "";
  let predictions: any[] = [];
  let totalPoints = 0;
  let errorMessage = "";

  try {
    const data = await getPlayerData(userId);

    username = data.username;
    predictions = data.predictions;
    totalPoints = data.totalPoints;
  } catch (error: any) {
    errorMessage = error.message;
  }

  return (
    <main className="player-page">
      <div className="bgGrid" />
      <div className="overlay" />

      <div className="shell">
        <header className="top-header">
          <div className="brand">
            <Image src="/images/logo.png" alt="Scorecast XI" width={443} height={319} className="logo" priority />
            <p className="tagline">Player guesses</p>
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

        <Link href="/leaderboard" className="back-link">
          ← Back to leaderboard
        </Link>

        <section className="card">
          <h1 className="player-title">{username}&apos;s guesses</h1>
          {!errorMessage && (
            <p style={{ color: "#7dd3fc", fontWeight: 900, marginBottom: 18, fontSize: 15 }}>
              Total points: {totalPoints}
            </p>
          )}

          {errorMessage ? (
            <div className="empty">Error: {errorMessage}</div>
          ) : predictions.length === 0 ? (
            <div className="empty">No visible guesses yet. Guesses only show after kickoff.</div>
          ) : (
            <div className="guesses-list">
              {predictions.map((prediction) => (
                <div key={prediction.matchId} className="guess-row">
                  <div className="guess-teams">
                    <strong>{prediction.homeTeam}</strong>
                    <span>vs</span>
                    <strong>{prediction.awayTeam}</strong>
                  </div>

                  <div className="guess-date">{formatKickoff(prediction.matchDate)}</div>

                  <div className="guess-scores">
                    <div className="score-block">
                      <span className="score-label">Guess</span>
                      <span className="score-value">
                        {prediction.guessHome} - {prediction.guessAway}
                      </span>
                    </div>

                    <div className="score-block">
                      <span className="score-label">Actual</span>
                      <span className="score-value">
                        {prediction.actualHome ?? "-"} - {prediction.actualAway ?? "-"}
                      </span>
                    </div>

                    <div className="score-block">
                      <span className="score-label">Points</span>
                      <span className="score-value points">
                        {prediction.points ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .player-page {
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
          max-width: 900px;
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
          margin-bottom: 20px;
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

        .back-link {
          display: inline-block;
          margin-bottom: 16px;
          color: #7dd3fc;
          font-weight: 700;
          text-decoration: none;
          font-size: 14px;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .card {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 18px;
          padding: 20px;
        }

        .player-title {
          margin: 0 0 18px 0;
          color: #fff;
          font-size: 22px;
          font-weight: 900;
        }

        .guesses-list {
          display: grid;
          gap: 12px;
        }

        .guess-row {
          padding: 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(147, 197, 253, 0.2);
          display: grid;
          gap: 8px;
        }

        .guess-teams {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #fff;
          font-size: 15px;
          flex-wrap: wrap;
        }

        .guess-teams span {
          color: #94a3b8;
          font-weight: 600;
        }

        .guess-date {
          color: #bfdbfe;
          font-size: 13px;
        }

        .guess-scores {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .score-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .score-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
          font-weight: 700;
        }

        .score-value {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
        }

        .score-value.points {
          color: #7dd3fc;
        }

        .empty {
          padding: 18px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(147, 197, 253, 0.2);
          color: #fff;
          font-weight: 800;
        }

        @media (max-width: 700px) {
          .shell {
            padding: 20px 16px;
          }

          .guess-scores {
            gap: 14px;
          }

          .score-value {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}

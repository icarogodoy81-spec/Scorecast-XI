"use client";

import { useState } from "react";

type PredictionDetail = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
  points: number;
  outcome: string;
};

type Standing = {
  userId: string;
  username: string;
  points: number;
  exactScores: number;
  goalDiff: number;
  correctResult: number;
  predictions: PredictionDetail[];
};

const THEME = {
  cardBg: "#1e293b",
  border: "#334155",
  mutedText: "#94a3b8",
  text: "#f8fafc",
  accent: "#93c5fd",
  green: "#4ade80",
};

export default function LeagueStandings({
  standings,
  currentUserId,
}: {
  standings: Standing[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<Standing | null>(null);

  return (
    <>
      <div
        style={{ background: THEME.cardBg, border: `1px solid ${THEME.border}`, color: THEME.text }}
        className="rounded-xl overflow-hidden"
      >
        <div style={{ borderBottom: `1px solid ${THEME.border}` }} className="px-4 py-3">
          <h2 style={{ color: THEME.mutedText }} className="text-sm font-semibold uppercase tracking-wide">
            Standings ({standings.length} players)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: THEME.mutedText, borderBottom: `1px solid ${THEME.border}` }} className="text-left">
                <th className="px-4 py-2 font-semibold">Rank</th>
                <th className="px-4 py-2 font-semibold">Player</th>
                <th className="px-4 py-2 font-semibold text-center">Points</th>
                <th className="px-4 py-2 font-semibold text-center">Exact Score</th>
                <th className="px-4 py-2 font-semibold text-center">Goal Diff</th>
                <th className="px-4 py-2 font-semibold text-center">Correct Result</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr
                  key={s.userId}
                  onClick={() => setSelected(s)}
                  style={{ borderTop: `1px solid ${THEME.border}` }}
                  className="cursor-pointer hover:bg-white/5 transition"
                >
                  <td style={{ color: THEME.mutedText }} className="px-4 py-3 font-bold">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={s.userId === currentUserId ? "font-bold" : "font-medium"}>
                      {s.username}
                    </span>
                    {s.userId === currentUserId && (
                      <span style={{ color: THEME.green }} className="text-xs ml-1">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{s.points}</td>
                  <td className="px-4 py-3 text-center">{s.exactScores}</td>
                  <td className="px-4 py-3 text-center">{s.goalDiff}</td>
                  <td className="px-4 py-3 text-center">{s.correctResult}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: THEME.cardBg, color: THEME.text, border: `1px solid ${THEME.border}` }}
            className="rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ borderBottom: `1px solid ${THEME.border}` }}
              className="px-5 py-4 flex items-center justify-between"
            >
              <h3 className="font-bold">{selected.username}&apos;s predictions</h3>
              <button
                onClick={() => setSelected(null)}
                style={{ color: THEME.mutedText }}
                className="hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              {selected.predictions.length === 0 && (
                <p style={{ color: THEME.mutedText }} className="px-5 py-4 text-sm">
                  No finished matches yet.
                </p>
              )}
              {selected.predictions.map((p) => (
                <div key={p.matchId} style={{ borderTop: `1px solid ${THEME.border}` }} className="px-5 py-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>
                      {p.homeTeam} {p.actualHome} - {p.actualAway} {p.awayTeam}
                    </span>
                    <span style={{ color: THEME.green }} className="font-bold">{p.points} pts</span>
                  </div>
                  <div style={{ color: THEME.mutedText }} className="text-xs mt-1">
                    Guessed {p.predictedHome} - {p.predictedAway} · {p.outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

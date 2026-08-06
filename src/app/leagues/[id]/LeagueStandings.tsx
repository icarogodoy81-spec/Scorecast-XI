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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-gray-900">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Standings ({standings.length} players)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-2 font-semibold">Rank</th>
                <th className="px-4 py-2 font-semibold">Player</th>
                <th className="px-4 py-2 font-semibold text-center">Points</th>
                <th className="px-4 py-2 font-semibold text-center">Exact Score</th>
                <th className="px-4 py-2 font-semibold text-center">Goal Diff</th>
                <th className="px-4 py-2 font-semibold text-center">Correct Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((s, i) => (
                <tr
                  key={s.userId}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-bold text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={s.userId === currentUserId ? "font-bold" : "font-medium"}>
                      {s.username}
                    </span>
                    {s.userId === currentUserId && (
                      <span className="text-xs text-green-600 ml-1">(you)</span>
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
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold">{selected.username}&apos;s predictions</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {selected.predictions.length === 0 && (
                <p className="px-5 py-4 text-gray-400 text-sm">No finished matches yet.</p>
              )}
              {selected.predictions.map((p) => (
                <div key={p.matchId} className="px-5 py-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>
                      {p.homeTeam} {p.actualHome} - {p.actualAway} {p.awayTeam}
                    </span>
                    <span className="font-bold text-green-600">{p.points} pts</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
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

"use client";

import { useEffect, useState } from "react";

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

type TeamMeta = { primary: string; secondary: string; shortName?: string };

const CLUB_COLOURS: Record<string, TeamMeta> = {
  flamengo: { primary: "#c8102e", secondary: "#111111", shortName: "FLA" },
  palmeiras: { primary: "#006437", secondary: "#ffffff", shortName: "PAL" },
  corinthians: { primary: "#111111", secondary: "#ffffff", shortName: "COR" },
  "sao paulo": { primary: "#d71920", secondary: "#111111", shortName: "SAO" },
  santos: { primary: "#111111", secondary: "#ffffff", shortName: "SAN" },
  fluminense: { primary: "#6f263d", secondary: "#00843d", shortName: "FLU" },
  vasco: { primary: "#111111", secondary: "#ffffff", shortName: "VAS" },
  botafogo: { primary: "#111111", secondary: "#ffffff", shortName: "BOT" },
  gremio: { primary: "#00a3e0", secondary: "#111111", shortName: "GRE" },
  internacional: { primary: "#d50032", secondary: "#ffffff", shortName: "INT" },
  cruzeiro: { primary: "#0033a0", secondary: "#ffffff", shortName: "CRU" },
  atletico: { primary: "#111111", secondary: "#ffffff", shortName: "CAM" },
  bahia: { primary: "#005bbb", secondary: "#d71920", shortName: "BAH" },
  fortaleza: { primary: "#0057b8", secondary: "#d71920", shortName: "FOR" },
  ceara: { primary: "#111111", secondary: "#ffffff", shortName: "CEA" },
  sport: { primary: "#c8102e", secondary: "#111111", shortName: "SPT" },
  vitoria: { primary: "#d71920", secondary: "#111111", shortName: "VIT" },
  juventude: { primary: "#00843d", secondary: "#ffffff", shortName: "JUV" },
  mirassol: { primary: "#f6c600", secondary: "#00843d", shortName: "MIR" },
  bragantino: { primary: "#ffffff", secondary: "#111111", shortName: "RBB" },
  cuiaba: { primary: "#00843d", secondary: "#f6c600", shortName: "CUI" },
  goias: { primary: "#00843d", secondary: "#ffffff", shortName: "GOI" },
  coritiba: { primary: "#00843d", secondary: "#ffffff", shortName: "CFC" },
  athletico: { primary: "#d71920", secondary: "#111111", shortName: "CAP" },
};

function normaliseTeamName(name: string) {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|ec|sc|ac|club|clube|regatas|futebol|football|sociedade|esporte)\b/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTeamMeta(teamName: string): TeamMeta {
  const normalised = normaliseTeamName(teamName);
  const exact = CLUB_COLOURS[teamName.toLowerCase()] || CLUB_COLOURS[normalised];
  if (exact) return exact;

  const foundKey = Object.keys(CLUB_COLOURS).find((key) => {
    const nk = normaliseTeamName(key);
    return normalised.includes(nk) || nk.includes(normalised);
  });
  if (foundKey) return CLUB_COLOURS[foundKey];

  return { primary: "#1f2937", secondary: "#e5e7eb", shortName: teamName.slice(0, 3).toUpperCase() };
}

function getHexBrightness(hex: string) {
  const c = hex.replace("#", "");
  if (c.length !== 6) return 0;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isLightColour(hex: string) {
  return getHexBrightness(hex) > 210;
}

function getBadgeTextColor(meta: TeamMeta) {
  return isLightColour(meta.primary) ? "#111827" : "#ffffff";
}

// ---- Logo lookup helpers (mirrors predictions page extraction) ----

function cleanLogoUrl(value: any) {
  if (!value || typeof value !== "string") return null;
  const logo = value.trim();
  return logo || null;
}

function extractName(side: any) {
  return (
    side?.name ||
    side?.team?.name ||
    ""
  );
}

function extractLogo(side: any) {
  return cleanLogoUrl(
    side?.crest ||
      side?.logo ||
      side?.emblem ||
      side?.image ||
      side?.team?.crest ||
      side?.team?.logo ||
      side?.logo_path ||
      side?.image_path
  );
}

function buildLogoMap(fixturesData: any): Record<string, string> {
  const map: Record<string, string> = {};

  const items =
    fixturesData?.fixtures ||
    fixturesData?.matches ||
    fixturesData?.data ||
    fixturesData?.response ||
    fixturesData ||
    [];

  if (!Array.isArray(items)) return map;

  for (const fixture of items) {
    const homeSide =
      fixture.homeTeam || fixture.home || fixture.teams?.home || fixture.participants?.home || fixture.localteam;
    const awaySide =
      fixture.awayTeam || fixture.away || fixture.teams?.away || fixture.participants?.away || fixture.visitorteam;

    const homeName = extractName(homeSide) || fixture.home_team || fixture.homeTeamName;
    const awayName = extractName(awaySide) || fixture.away_team || fixture.awayTeamName;

    const homeLogo = extractLogo(homeSide) || cleanLogoUrl(fixture.home_logo || fixture.homeLogo);
    const awayLogo = extractLogo(awaySide) || cleanLogoUrl(fixture.away_logo || fixture.awayLogo);

    if (homeName && homeLogo) map[normaliseTeamName(homeName)] = homeLogo;
    if (awayName && awayLogo) map[normaliseTeamName(awayName)] = awayLogo;
  }

  return map;
}

function TeamBadge({ name, logoMap }: { name: string; logoMap: Record<string, string> }) {
  const [failed, setFailed] = useState(false);
  const meta = getTeamMeta(name);
  const logo = logoMap[normaliseTeamName(name)];

  const style = {
    background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
    color: getBadgeTextColor(meta),
    borderColor: isLightColour(meta.primary) ? "#64748b" : meta.primary,
  };

  if (logo && !failed) {
    return (
      <div
        style={style}
        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
      >
        <img
          src={logo}
          alt={`${name} badge`}
          className="w-full h-full object-contain bg-white/80"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
    >
      {meta.shortName}
    </div>
  );
}

export default function LeagueStandings({
  standings,
  currentUserId,
}: {
  standings: Standing[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<Standing | null>(null);
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadLogos() {
      try {
        const res = await fetch("/api/fixtures", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setLogoMap(buildLogoMap(data));
      } catch {
        // silently fall back to initials
      }
    }
    loadLogos();
  }, []);

  return (
    <>
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="border-b border-white/10 px-4 py-3 bg-white/5">
          <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">
            Standings ({standings.length} players)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-100">
            <thead>
              <tr className="text-left border-b border-white/10 bg-black/20 text-slate-300">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold text-center">Points</th>
                <th className="px-4 py-3 font-semibold text-center">Exact Score</th>
                <th className="px-4 py-3 font-semibold text-center">Goal Diff</th>
                <th className="px-4 py-3 font-semibold text-center">Correct Result</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr
                  key={s.userId}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-white/10 transition-colors border-t border-white/5"
                >
                  <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={s.userId === currentUserId ? "font-bold text-white" : "font-medium"}>
                      {s.username}
                    </span>
                    {s.userId === currentUserId && (
                      <span className="text-green-400 text-xs ml-2">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-400">{s.points}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{s.exactScores}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{s.goalDiff}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{s.correctResult}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900/80 backdrop-blur-md text-slate-100 border border-white/20 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
              <h3 className="font-bold text-lg">{selected.username}&apos;s predictions</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="px-5 py-5 flex flex-col gap-3 bg-gradient-to-b from-transparent to-black/20">
              {selected.predictions.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">
                  No matches started yet.
                </p>
              )}

              {selected.predictions.map((p) => (
                <div
                  key={p.matchId}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TeamBadge name={p.homeTeam} logoMap={logoMap} />
                      <span className="text-sm font-medium truncate">{p.homeTeam}</span>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-lg px-4 py-1.5 font-bold text-base mx-2 shrink-0 shadow-inner">
                      {p.actualHome} - {p.actualAway}
                    </div>

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-sm font-medium truncate text-right">{p.awayTeam}</span>
                      <TeamBadge name={p.awayTeam} logoMap={logoMap} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                    <span className="text-slate-400">
                      Guessed <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1 mr-1">{p.predictedHome} - {p.predictedAway}</strong> · {p.outcome}
                    </span>
                    <span className="text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-md">
                      {p.points} pts
                    </span>
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

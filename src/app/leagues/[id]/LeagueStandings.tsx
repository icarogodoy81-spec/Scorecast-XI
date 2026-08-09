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

const THEME = {
  cardBg: "#1e293b",
  border: "#334155",
  mutedText: "#94a3b8",
  text: "#f8fafc",
  accent: "#93c5fd",
  green: "#4ade80",
  inputBg: "#020617",
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
        className="w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden shrink-0"
      >
        <img
          src={logo}
          alt={`${name} badge`}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
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
            className="rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ borderBottom: `1px solid ${THEME.border}` }}
              className="px-5 py-4 flex items-center justify-between sticky top-0"
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

            <div className="px-5 py-4 flex flex-col gap-3">
              {selected.predictions.length === 0 && (
                <p style={{ color: THEME.mutedText }} className="text-sm">
                  No matches started yet.
                </p>
              )}

              {selected.predictions.map((p) => (
                <div
                  key={p.matchId}
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.border}` }}
                  className="rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamBadge name={p.homeTeam} logoMap={logoMap} />
                      <span className="text-xs font-medium truncate">{p.homeTeam}</span>
                    </div>

                    <div
                      style={{ background: THEME.inputBg, border: `1px solid ${THEME.border}` }}
                      className="rounded-md px-3 py-1 font-bold text-sm mx-2 shrink-0"
                    >
                      {p.actualHome} - {p.actualAway}
                    </div>

                    <div className="flex items-center gap-2 min-w-0 justify-end">
                      <span className="text-xs font-medium truncate">{p.awayTeam}</span>
                      <TeamBadge name={p.awayTeam} logoMap={logoMap} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: THEME.mutedText }}>
                    <span>
                      Guessed <strong style={{ color: THEME.text }}>{p.predictedHome} - {p.predictedAway}</strong> · {p.outcome}
                    </span>
                    <span style={{ color: THEME.green }} className="font-bold">
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

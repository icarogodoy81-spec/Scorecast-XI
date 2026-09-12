/* eslint-disable @next/next/no-img-element */
'use client';

import { CSSProperties, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { COMPETITIONS } from '@/lib/competitions';

type Fixture = any;

type PredictionState = {
  [fixtureId: string]: {
    home: string;
    away: string;
  };
};

type TeamMeta = {
  primary: string;
  secondary: string;
  shortName?: string;
};

const CLUB_COLOURS: Record<string, TeamMeta> = {
  flamengo: { primary: '#c8102e', secondary: '#111111', shortName: 'FLA' },
  palmeiras: { primary: '#006437', secondary: '#ffffff', shortName: 'PAL' },
  corinthians: { primary: '#111111', secondary: '#ffffff', shortName: 'COR' },
  'sao paulo': { primary: '#d71920', secondary: '#111111', shortName: 'SAO' },
  'são paulo': { primary: '#d71920', secondary: '#111111', shortName: 'SAO' },
  santos: { primary: '#111111', secondary: '#ffffff', shortName: 'SAN' },
  fluminense: { primary: '#6f263d', secondary: '#00843d', shortName: 'FLU' },
  vasco: { primary: '#111111', secondary: '#ffffff', shortName: 'VAS' },
  botafogo: { primary: '#111111', secondary: '#ffffff', shortName: 'BOT' },
  gremio: { primary: '#00a3e0', secondary: '#111111', shortName: 'GRE' },
  grêmio: { primary: '#00a3e0', secondary: '#111111', shortName: 'GRE' },
  internacional: { primary: '#d50032', secondary: '#ffffff', shortName: 'INT' },
  cruzeiro: { primary: '#0033a0', secondary: '#ffffff', shortName: 'CRU' },
  atletico: { primary: '#111111', secondary: '#ffffff', shortName: 'CAM' },
  'atlético mineiro': { primary: '#111111', secondary: '#ffffff', shortName: 'CAM' },
  bahia: { primary: '#005bbb', secondary: '#d71920', shortName: 'BAH' },
  fortaleza: { primary: '#0057b8', secondary: '#d71920', shortName: 'FOR' },
  ceara: { primary: '#111111', secondary: '#ffffff', shortName: 'CEA' },
  ceará: { primary: '#111111', secondary: '#ffffff', shortName: 'CEA' },
  sport: { primary: '#c8102e', secondary: '#111111', shortName: 'SPT' },
  vitoria: { primary: '#d71920', secondary: '#111111', shortName: 'VIT' },
  vitória: { primary: '#d71920', secondary: '#111111', shortName: 'VIT' },
  juventude: { primary: '#00843d', secondary: '#ffffff', shortName: 'JUV' },
  mirassol: { primary: '#f6c600', secondary: '#00843d', shortName: 'MIR' },
  bragantino: { primary: '#ffffff', secondary: '#111111', shortName: 'RBB' },
  'red bull bragantino': { primary: '#ffffff', secondary: '#d71920', shortName: 'RBB' },
  cuiaba: { primary: '#00843d', secondary: '#f6c600', shortName: 'CUI' },
  cuiabá: { primary: '#00843d', secondary: '#f6c600', shortName: 'CUI' },
  goias: { primary: '#00843d', secondary: '#ffffff', shortName: 'GOI' },
  goiás: { primary: '#00843d', secondary: '#ffffff', shortName: 'GOI' },
  coritiba: { primary: '#00843d', secondary: '#ffffff', shortName: 'CFC' },
  athletico: { primary: '#d71920', secondary: '#111111', shortName: 'CAP' },
  'athletico-pr': { primary: '#d71920', secondary: '#111111', shortName: 'CAP' },
  'athletico paranaense': { primary: '#d71920', secondary: '#111111', shortName: 'CAP' },
};

function normaliseTeamName(name: string) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|ec|sc|ac|club|clube|regatas|futebol|football|sociedade|esporte|esporte clube)\b/gi, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTeamMeta(teamName: string): TeamMeta {
  const normalised = normaliseTeamName(teamName);
  const exactMatch = CLUB_COLOURS[teamName.toLowerCase()] || CLUB_COLOURS[normalised];
  if (exactMatch) return exactMatch;

  const foundKey = Object.keys(CLUB_COLOURS).find((key) => {
    const normalisedKey = normaliseTeamName(key);
    return normalised.includes(normalisedKey) || normalisedKey.includes(normalised);
  });

  if (foundKey) return CLUB_COLOURS[foundKey];

  return {
    primary: '#1f2937',
    secondary: '#e5e7eb',
    shortName: teamName.slice(0, 3).toUpperCase(),
  };
}

function getHexBrightness(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0;
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isLightColour(hex: string) {
  return getHexBrightness(hex) > 210;
}

function getGradientColour(meta: TeamMeta) {
  if (!isLightColour(meta.primary)) return meta.primary;
  if (meta.secondary && !isLightColour(meta.secondary)) return meta.secondary;
  return '#64748b';
}

function getBadgeTextColor(meta: TeamMeta) {
  if (isLightColour(meta.primary) && isLightColour(meta.secondary)) return '#111827';
  return isLightColour(meta.primary) ? '#111827' : '#ffffff';
}

function getInitials(name: string) {
  const words = String(name)
    .replace(/[^\wÀ-ÿ ]/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return String(name).slice(0, 3).toUpperCase();
}

function getFixtureId(fixture: Fixture) {
  return (
    fixture.api_fixture_id ||
    fixture.fixture_id ||
    fixture.fixture?.id ||
    fixture.id ||
    fixture.fixture?.fixture_id
  );
}

function getHomeName(fixture: Fixture) {
  return (
    fixture.homeTeam?.name ||
    fixture.homeTeam?.shortName ||
    fixture.home?.name ||
    fixture.home?.team?.name ||
    fixture.teams?.home?.name ||
    fixture.participants?.home?.name ||
    fixture.localteam?.name ||
    fixture.home_team ||
    fixture.homeTeamName ||
    fixture.team_home ||
    'Home'
  );
}

function getAwayName(fixture: Fixture) {
  return (
    fixture.awayTeam?.name ||
    fixture.awayTeam?.shortName ||
    fixture.away?.name ||
    fixture.away?.team?.name ||
    fixture.teams?.away?.name ||
    fixture.participants?.away?.name ||
    fixture.visitorteam?.name ||
    fixture.away_team ||
    fixture.awayTeamName ||
    fixture.team_away ||
    'Away'
  );
}

function cleanLogoUrl(value: any) {
  if (!value || typeof value !== 'string') return null;
  const logo = value.trim();
  return logo || null;
}

function getHomeLogo(fixture: Fixture) {
  return cleanLogoUrl(
    fixture.homeTeam?.crest ||
      fixture.homeTeam?.logo ||
      fixture.homeTeam?.emblem ||
      fixture.homeTeamCrest ||
      fixture.homeTeamLogo ||
      fixture.home_crest ||
      fixture.home_logo ||
      fixture.homeLogo ||
      fixture.home_team_logo ||
      fixture.home?.crest ||
      fixture.home?.logo ||
      fixture.home?.image ||
      fixture.home?.team?.crest ||
      fixture.home?.team?.logo ||
      fixture.teams?.home?.crest ||
      fixture.teams?.home?.logo ||
      fixture.participants?.home?.crest ||
      fixture.participants?.home?.logo ||
      fixture.localteam?.logo_path ||
      fixture.localteam?.image_path
  );
}

function getAwayLogo(fixture: Fixture) {
  return cleanLogoUrl(
    fixture.awayTeam?.crest ||
      fixture.awayTeam?.logo ||
      fixture.awayTeam?.emblem ||
      fixture.awayTeamCrest ||
      fixture.awayTeamLogo ||
      fixture.away_crest ||
      fixture.away_logo ||
      fixture.awayLogo ||
      fixture.away_team_logo ||
      fixture.away?.crest ||
      fixture.away?.logo ||
      fixture.away?.image ||
      fixture.away?.team?.crest ||
      fixture.away?.team?.logo ||
      fixture.teams?.away?.crest ||
      fixture.teams?.away?.logo ||
      fixture.participants?.away?.crest ||
      fixture.participants?.away?.logo ||
      fixture.visitorteam?.logo_path ||
      fixture.visitorteam?.image_path
  );
}

function getKickoff(fixture: Fixture) {
  return (
    fixture.utcDate ||
    fixture.kickoff ||
    fixture.date ||
    fixture.fixture_date ||
    fixture.fixture?.date ||
    fixture.time?.starting_at?.date_time ||
    fixture.starting_at ||
    null
  );
}

function getStatus(fixture: Fixture) {
  return (
    fixture.status ||
    fixture.fixture_status ||
    fixture.fixture?.status?.short ||
    fixture.fixture?.status?.long ||
    fixture.time?.status ||
    ''
  );
}

function getHomeScore(fixture: Fixture) {
  return (
    fixture.score?.fullTime?.home ??
    fixture.score?.fulltime?.home ??
    fixture.home_score ??
    fixture.goals?.home ??
    fixture.scores?.localteam_score ??
    null
  );
}

function getAwayScore(fixture: Fixture) {
  return (
    fixture.score?.fullTime?.away ??
    fixture.score?.fulltime?.away ??
    fixture.away_score ??
    fixture.goals?.away ??
    fixture.scores?.visitorteam_score ??
    null
  );
}

function formatDate(value: string | null) {
  if (!value) return 'Date TBC';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isLocked(fixture: Fixture) {
  const kickoff = getKickoff(fixture);
  const status = String(getStatus(fixture)).toUpperCase();

  if (
    ['FT', 'FINISHED', 'AET', 'PEN', 'LIVE', 'IN_PLAY', 'PAUSED', '1H', '2H', 'HT'].includes(status)
  ) {
    return true;
  }

  if (!kickoff) return false;
  return new Date(kickoff).getTime() <= Date.now();
}

function TeamBadge({ name, logo, meta }: { name: string; logo: string | null; meta: TeamMeta }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const badgeBorderColour = getGradientColour(meta);

  const badgeStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
    borderColor: badgeBorderColour,
    color: getBadgeTextColor(meta),
  };

  if (logo && !logoFailed) {
    return (
      <div className="w-14 h-14 rounded-xl shadow-sm border flex items-center justify-center overflow-hidden shrink-0" style={badgeStyle}>
        <img src={logo} alt={`${name} badge`} className="w-full h-full object-contain p-1.5" loading="lazy" onError={() => setLogoFailed(true)} />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-xl shadow-sm border flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm" style={badgeStyle}>
      <span>{meta.shortName || getInitials(name)}</span>
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 text-slate-900" />}>
      <PredictionsContent />
    </Suspense>
  );
}

function PredictionsContent() {
  const searchParams = useSearchParams();
  const urlCompetitionCode = searchParams.get('competition_code');
  const urlLeagueName = searchParams.get('league_name');

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState<PredictionState>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [joinedCodes, setJoinedCodes] = useState<string[] | null>(null);
  const [selectedCompetitionCode, setSelectedCompetitionCode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'BSA';
    return window.localStorage.getItem('selectedCompetitionCode') || 'BSA';
  });

  useEffect(() => {
    if (urlCompetitionCode) {
      const code = urlCompetitionCode.toUpperCase();
      setSelectedCompetitionCode(code);
      window.localStorage.setItem('selectedCompetitionCode', code);
    }
  }, [urlCompetitionCode]);

  useEffect(() => {
    async function loadMyLeagues() {
      try {
        const res = await fetch('/api/my-leagues', { cache: 'no-store' });
        if (!res.ok) {
          setJoinedCodes([]);
          return;
        }
        const data = await res.json();
        setJoinedCodes(
          (data.competitionCodes || []).map((code: string) => code.toUpperCase())
        );
      } catch {
        setJoinedCodes([]);
      }
    }
    loadMyLeagues();
  }, []);

  useEffect(() => {
    if (joinedCodes === null || joinedCodes.length === 0) return;
    if (urlCompetitionCode) return;
    if (!joinedCodes.includes(selectedCompetitionCode)) {
      const code = joinedCodes[0];
      setSelectedCompetitionCode(code);
      window.localStorage.setItem('selectedCompetitionCode', code);
    }
  }, [joinedCodes, selectedCompetitionCode, urlCompetitionCode]);

  const availableCompetitions = useMemo(() => {
    const codes = joinedCodes ?? [];
    return codes.map((code) => {
      const match = COMPETITIONS.find((c) => c.code.toUpperCase() === code);
      return { code, name: match?.name || code };
    });
  }, [joinedCodes]);

  const effectiveCode = urlCompetitionCode
    ? urlCompetitionCode.toUpperCase()
    : selectedCompetitionCode;

  const isReady = joinedCodes !== null;

  useEffect(() => {
    if (!isReady) return;
    if (!effectiveCode) return;
    if (!joinedCodes.includes(effectiveCode)) return;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const fixturesUrl = `/api/fixtures?competition_code=${effectiveCode.toUpperCase()}`;

        const [fixturesRes, predictionsRes] = await Promise.all([
          fetch(fixturesUrl, { cache: 'no-store' }),
          fetch('/api/predictions', { cache: 'no-store' }),
        ]);

        if (!fixturesRes.ok) {
          throw new Error(`Failed to load fixtures: ${fixturesRes.status}`);
        }

        const fixturesData = await fixturesRes.json();
        const items =
          fixturesData.fixtures ||
          fixturesData.matches ||
          fixturesData.data ||
          fixturesData.response ||
          fixturesData ||
          [];

        const upcomingOnly = Array.isArray(items)
          ? items.filter((fixture) => {
              const status = String(getStatus(fixture)).toUpperCase();
              return ![
                'FT', 'FINISHED', 'AET', 'PEN',
                'PST', 'POSTPONED', 'CANCELLED', 'CANCELED', 'SUSPENDED',
              ].includes(status);
            })
          : [];

        setFixtures(upcomingOnly);

        if (predictionsRes.ok) {
          const predictionsData = await predictionsRes.json();
          const existing: PredictionState = {};
          const savedMap: Record<string, boolean> = {};

          for (const row of predictionsData.predictions || []) {
            const key = String(row.match_id);
            existing[key] = {
              home: String(row.home_score),
              away: String(row.away_score),
            };
            savedMap[key] = true;
          }

          setPredictions(existing);
          setSavedPredictions(savedMap);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [effectiveCode, isReady, joinedCodes]);

  const groupedFixtures = useMemo(() => {
    return fixtures.reduce<Record<string, Fixture[]>>((groups, fixture) => {
      const kickoff = getKickoff(fixture);
      const key = kickoff
        ? new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }).format(new Date(kickoff))
        : 'Date TBC';

      if (!groups[key]) groups[key] = [];
      groups[key].push(fixture);
      return groups;
    }, {});
  }, [fixtures]);

  function updatePrediction(fixtureId: string, side: 'home' | 'away', value: string) {
    const cleanValue = value.replace(/\D/g, '').slice(0, 2);

    setPredictions((current) => ({
      ...current,
      [fixtureId]: {
        home: current[fixtureId]?.home ?? '',
        away: current[fixtureId]?.away ?? '',
        [side]: cleanValue,
      },
    }));

    setSavedPredictions((current) => ({ ...current, [fixtureId]: false }));
    setSaveError((current) => ({ ...current, [fixtureId]: '' }));
  }

  async function savePrediction(fixture: Fixture) {
    const fixtureId = String(getFixtureId(fixture));
    const prediction = predictions[fixtureId];

    if (!prediction?.home || !prediction?.away) return;

    setSavingId(fixtureId);
    setSaveError((current) => ({ ...current, [fixtureId]: '' }));

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureId,
          homeScore: Number(prediction.home),
          awayScore: Number(prediction.away),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prediction');
      }

      setSavedPredictions((current) => ({ ...current, [fixtureId]: true }));
    } catch (err: any) {
      setSaveError((current) => ({
        ...current,
        [fixtureId]: err.message || 'Failed to save prediction',
      }));
    } finally {
      setSavingId(null);
    }
  }

  if (isReady && availableCompetitions.length === 0 && !urlCompetitionCode) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            No leagues joined yet
          </h1>
          <p className="text-slate-500 mb-6">
            Join a league to start making predictions.
          </p>
          <a
            href="/leagues"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors shadow-sm"
          >
            Browse leagues
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Make your predictions</h1>
            <p className="text-slate-500 mt-1">{fixtures.length} fixtures available</p>
          </div>

          <div className="flex flex-col gap-2 min-w-[200px] flex-1 md:flex-none">
            <label
              htmlFor="league-select"
              className="text-xs font-semibold tracking-wider text-blue-600 uppercase"
            >
              League
            </label>
            
            {urlCompetitionCode ? (
              <div className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 text-sm font-bold shadow-inner">
                {urlLeagueName || 
                  COMPETITIONS.find((c) => c.code.toUpperCase() === urlCompetitionCode.toUpperCase())?.name || 
                  urlCompetitionCode}
              </div>
            ) : joinedCodes === null ? (
              <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-4 py-2.5 text-sm shadow-inner">
                Loading…
              </div>
            ) : (
              <select
                id="league-select"
                value={selectedCompetitionCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSelectedCompetitionCode(code);
                  window.localStorage.setItem('selectedCompetitionCode', code);
                }}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer outline-none focus:border-blue-500 shadow-sm"
              >
                {availableCompetitions.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-sm text-blue-900 mb-8 shadow-sm">
          <strong className="text-blue-700 font-semibold mr-1">Note:</strong> 
          Match statuses (In Play, Finished) are updated periodically. Points will be awarded once the match result is officially finalized in our system.
        </div>

        <section className="space-y-8">
          {Object.entries(groupedFixtures).map(([dateLabel, items]) => (
            <div key={dateLabel} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">{dateLabel}</h2>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {items.map((fixture) => {
                  const fixtureId = String(getFixtureId(fixture));
                  const homeName = getHomeName(fixture);
                  const awayName = getAwayName(fixture);
                  const homeLogo = getHomeLogo(fixture);
                  const awayLogo = getAwayLogo(fixture);
                  const kickoff = getKickoff(fixture);
                  const status = getStatus(fixture);
                  const locked = isLocked(fixture);
                  const homeScore = getHomeScore(fixture);
                  const awayScore = getAwayScore(fixture);
                  const homeMeta = getTeamMeta(homeName);
                  const awayMeta = getTeamMeta(awayName);

                  const prediction = predictions[fixtureId] || { home: '', away: '' };
                  const saved = savedPredictions[fixtureId];
                  const isSaving = savingId === fixtureId;
                  const errorMsg = saveError[fixtureId];

                  return (
                    <article 
                      key={fixtureId} 
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-600">{formatDate(kickoff)}</span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                            locked 
                              ? 'bg-red-50 text-red-600 border border-red-200' 
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {locked ? status || 'Locked' : 'Open'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col items-center flex-1 text-center gap-2">
                          <TeamBadge name={homeName} logo={homeLogo} meta={homeMeta} />
                          <strong className="text-sm font-semibold text-slate-900 leading-tight">{homeName}</strong>
                        </div>

                        <div className="shrink-0 mx-2">
                          {locked && homeScore !== null && awayScore !== null ? (
                            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg font-bold text-lg text-slate-900 text-center shadow-inner">
                              <span>{homeScore}</span>
                              <small className="text-slate-400 mx-1">-</small>
                              <span>{awayScore}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                value={prediction.home}
                                onChange={(e) => updatePrediction(fixtureId, 'home', e.target.value)}
                                disabled={locked}
                                inputMode="numeric"
                                placeholder="0"
                                className="w-12 h-12 bg-slate-50 border border-slate-300 text-slate-900 text-center text-lg font-bold rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 shadow-inner transition-colors"
                              />
                              <span className="text-slate-400 font-bold">-</span>
                              <input
                                value={prediction.away}
                                onChange={(e) => updatePrediction(fixtureId, 'away', e.target.value)}
                                disabled={locked}
                                inputMode="numeric"
                                placeholder="0"
                                className="w-12 h-12 bg-slate-50 border border-slate-300 text-slate-900 text-center text-lg font-bold rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 shadow-inner transition-colors"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-center flex-1 text-center gap-2">
                          <TeamBadge name={awayName} logo={awayLogo} meta={awayMeta} />
                          <strong className="text-sm font-semibold text-slate-900 leading-tight">{awayName}</strong>
                        </div>
                      </div>

                      <button
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                          saved
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : locked || !prediction.home || !prediction.away
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                        disabled={locked || !prediction.home || !prediction.away || isSaving}
                        onClick={() => savePrediction(fixture)}
                      >
                        {locked
                          ? 'Prediction closed'
                          : isSaving
                          ? 'Saving...'
                          : saved
                          ? 'Prediction saved ✓'
                          : 'Save prediction'}
                      </button>

                      {errorMsg && (
                        <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{errorMsg}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

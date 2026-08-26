/* eslint-disable @next/next/no-img-element */
'use client';

import { CSSProperties, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import '../fixtures/fixtures.css';
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

const THEME = {
  darkBlue: '#0f172a',
  darkBlue2: '#111c34',
  darkBlue3: '#172554',
  border: '#243b63',
  text: '#f8fafc',
  mutedText: '#cbd5e1',
  inputBg: '#020617',
  button: '#1e40af',
  buttonHover: '#2563eb',
  green: '#16a34a',
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
      <div className="badge-wrap" style={badgeStyle}>
        <img src={logo} alt={`${name} badge`} loading="lazy" onError={() => setLogoFailed(true)} />
      </div>
    );
  }

  return (
    <div className="badge-wrap" style={badgeStyle}>
      <span>{meta.shortName || getInitials(name)}</span>
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense
      fallback={
        <main style={{ background: THEME.darkBlue, minHeight: '100vh', color: THEME.text }} />
      }
    >
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

  // URL param is authoritative: when a league page links here with
  // ?competition_code=X, drive the view from X and persist it.
  useEffect(() => {
    if (urlCompetitionCode) {
      const code = urlCompetitionCode.toUpperCase();
      setSelectedCompetitionCode(code);
      window.localStorage.setItem('selectedCompetitionCode', code);
    }
  }, [urlCompetitionCode]);

  // Load the competition codes of the leagues this user has joined.
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

  // If the stored/default selection isn't one of the joined leagues, snap to the first.
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

  const pageStyle: CSSProperties = { background: THEME.darkBlue, color: THEME.text, minHeight: '100vh' };
  const shellStyle: CSSProperties = { background: THEME.darkBlue, color: THEME.text };
  const headerStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${THEME.darkBlue2}, ${THEME.darkBlue3})`,
    borderColor: THEME.border,
    color: THEME.text,
  };
  const dateGroupStyle: CSSProperties = {
    background: THEME.darkBlue2,
    borderColor: THEME.border,
    color: THEME.text,
  };

  if (isReady && availableCompetitions.length === 0 && !urlCompetitionCode) {
    return (
      <main style={shellStyle}>
        <div
          style={{
            ...pageStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h1 style={{ color: THEME.text, fontSize: 24, fontWeight: 700 }}>
              No leagues joined yet
            </h1>
            <p style={{ color: THEME.mutedText, marginTop: 8 }}>
              Join a league to start making predictions.
            </p>
            <a
              href="/leagues"
              style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '10px 20px',
                background: THEME.green,
                color: '#ffffff',
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Browse leagues
            </a>
          </div>
        </div>
      </main>
    );
  }

  const topBar = (
    <>
      <header
        className="fixtures-header"
        style={{
          ...headerStyle,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <p className="eyebrow" style={{ color: '#93c5fd' }}></p>
          <h1 style={{ color: THEME.text }}>Make your predictions</h1>
          <p style={{ color: THEME.mutedText }}>{fixtures.length} fixtures available</p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: '200px',
          }}
        >
          <label
            htmlFor="league-select"
            style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600, letterSpacing: '0.03em' }}
          >
            League
          </label>
          {urlCompetitionCode ? (
            <div
              style={{
                width: '100%',
                background: THEME.inputBg,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {urlLeagueName || 
                COMPETITIONS.find((c) => c.code.toUpperCase() === urlCompetitionCode.toUpperCase())?.name || 
                urlCompetitionCode}
            </div>
              style={{
                width: '100%',
                background: THEME.inputBg,
                color: THEME.mutedText,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
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
              style={{
                width: '100%',
                background: THEME.inputBg,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
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

      <div style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderLeft: '4px solid #3b82f6',
        padding: '12px 16px',
        marginTop: '20px',
        borderRadius: '4px',
        fontSize: '14px',
        color: THEME.text,
        lineHeight: '1.5'
      }}>
        <strong style={{ color: '#93c5fd' }}>Note:</strong> Match statuses (In Play, Finished) are updated periodically. Points will be awarded once the match result is officially finalized in our system.
      </div>

      <section className="fixtures-groups">
        {Object.entries(groupedFixtures).map(([dateLabel, items]) => (
          <div key={dateLabel} className="fixture-date-group" style={dateGroupStyle}>
            <h2 style={{ color: THEME.text }}>{dateLabel}</h2>

            <div className="fixtures-grid">
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

                const cardStyle: CSSProperties = {
                  background: `linear-gradient(135deg, ${THEME.darkBlue}, ${THEME.darkBlue2})`,
                  borderColor: THEME.border,
                  color: THEME.text,
                  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
                };

                const inputStyle: CSSProperties = {
                  background: THEME.inputBg,
                  borderColor: THEME.border,
                  color: THEME.text,
                };

                return (
                  <article key={fixtureId} className="prediction-card" style={cardStyle}>
                    <div className="card-top">
                      <span style={{ color: THEME.text, fontWeight: 700 }}>{formatDate(kickoff)}</span>

                      <span
                        className={locked ? 'status locked' : 'status'}
                        style={{
                          background: locked ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                          borderColor: locked ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.45)',
                          color: locked ? '#fecaca' : '#bbf7d0',
                        }}
                      >
                        {locked ? status || 'Locked' : 'Open'}
                      </span>
                    </div>

                    <div className="teams-row">
                      <div className="team team-home" style={{ color: THEME.text }}>
                        <TeamBadge name={homeName} logo={homeLogo} meta={homeMeta} />
                        <strong style={{ color: THEME.text }}>{homeName}</strong>
                      </div>

                      <div className="score-area">
                        {locked && homeScore !== null && awayScore !== null ? (
                          <div
                            className="final-score"
                            style={{ background: THEME.inputBg, borderColor: THEME.border, color: THEME.text }}
                          >
                            <span>{homeScore}</span>
                            <small style={{ color: THEME.mutedText }}>-</small>
                            <span>{awayScore}</span>
                          </div>
                        ) : (
                          <div className="prediction-inputs">
                            <input
                              value={prediction.home}
                              onChange={(e) => updatePrediction(fixtureId, 'home', e.target.value)}
                              disabled={locked}
                              inputMode="numeric"
                              placeholder="0"
                              style={inputStyle}
                            />
                            <span style={{ color: THEME.text }}>-</span>
                            <input
                              value={prediction.away}
                              onChange={(e) => updatePrediction(fixtureId, 'away', e.target.value)}
                              disabled={locked}
                              inputMode="numeric"
                              placeholder="0"
                              style={inputStyle}
                            />
                          </div>
                        )}
                      </div>

                      <div className="team team-away" style={{ color: THEME.text }}>
                        <TeamBadge name={awayName} logo={awayLogo} meta={awayMeta} />
                        <strong style={{ color: THEME.text }}>{awayName}</strong>
                      </div>
                    </div>

                    <button
                      className="save-button"
                      disabled={locked || !prediction.home || !prediction.away || isSaving}
                      onClick={() => savePrediction(fixture)}
                      style={
                        saved
                          ? { background: THEME.green, borderColor: THEME.green, color: '#ffffff' }
                          : {
                              background:
                                locked || !prediction.home || !prediction.away ? '#334155' : THEME.button,
                              borderColor:
                                locked || !prediction.home || !prediction.away ? '#475569' : THEME.button,
                              color: THEME.text,
                            }
                      }
                    >
                      {locked
                        ? 'Prediction closed'
                        : isSaving
                        ? 'Saving...'
                        : saved
                        ? 'Prediction saved'
                        : 'Save prediction'}
                    </button>

                    {errorMsg ? (
                      <p style={{ color: '#fecaca', fontSize: 13, marginTop: 6 }}>{errorMsg}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );

  return (
    <main style={shellStyle}>
      <div style={pageStyle}>{topBar}</div>
    </main>
  );
}

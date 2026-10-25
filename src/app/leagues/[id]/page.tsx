import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LeagueStandings from "./LeagueStandings";

export const dynamic = "force-dynamic";

const VISIBLE_STATUSES = [
  "FT",
  "FINISHED",
  "AET",
  "PEN",
  "LIVE",
  "IN_PLAY",
  "1H",
  "2H",
  "HT",
  "PAUSED",
];

const POINTS_EXACT = 4;
const POINTS_GOAL_DIFF = 3;
const POINTS_RESULT = 2;

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .single();

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        League not found.
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>You&apos;re not a member of this league.</p>
        <Link href="/leagues" className="text-green-400 hover:underline">
          Back to leagues
        </Link>
      </div>
    );
  }

  const { data: competitionRows } = await supabase
    .from("league_competitions")
    .select("competition_code")
    .eq("league_id", leagueId);

  const competitionCodes = [
    ...new Set(
      (competitionRows ?? [])
        .map((row) => row.competition_code)
        .filter((code): code is string => Boolean(code))
    ),
  ];

  // Fall back to the league's original competition for existing leagues.
  if (competitionCodes.length === 0 && league.competition_code) {
    competitionCodes.push(league.competition_code);
  }

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, username)")
    .eq("league_id", leagueId);

  const userIds = (members || []).map((member: any) => member.user_id);

  if (userIds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        No members yet.
      </div>
    );
  }

  let fixtures: any[] = [];

  if (competitionCodes.length > 0) {
    const { data: leagueFixtures } = await supabase
      .from("fixtures")
      .select(
        "id, api_fixture_id, home_team_name, away_team_name, home_score, away_score, competition_code"
      )
      .in("competition_code", competitionCodes);

    fixtures = leagueFixtures ?? [];
  }

  const fixtureIds = [...new Set(fixtures.map((fixture: any) => fixture.id))];

  let predictions: any[] = [];

  if (fixtureIds.length > 0) {
    const { data: leaguePredictions } = await supabase
      .from("predictions")
      .select(
        "id, user_id, home_score, away_score, actual_home_score, actual_away_score, points, match_id"
      )
      .in("user_id", userIds)
      .in("match_id", fixtureIds);

    predictions = leaguePredictions ?? [];
  }

  const fixturesById = new Map(
    fixtures.map((fixture: any) => [fixture.id, fixture])
  );

  const apiFixtureIds = [
    ...new Set(
      fixtures
        .map((fixture: any) => fixture.api_fixture_id)
        .filter(Boolean)
    ),
  ];

  let matches: any[] = [];

  if (apiFixtureIds.length > 0) {
    const { data: matchesData } = await supabase
      .from("matches")
      .select(
        "api_fixture_id, home_team, away_team, match_date, status, home_score, away_score"
      )
      .in("api_fixture_id", apiFixtureIds);

    matches = matchesData ?? [];
  }

  const matchesByApiId = new Map(
    matches.map((match: any) => [match.api_fixture_id, match])
  );

  const now = new Date();

  const standings = (members || []).map((member: any) => {
    const username = member.profiles?.username || "Unknown";
    const userPredictions = predictions.filter(
      (prediction: any) => prediction.user_id === member.user_id
    );

    let totalPoints = 0;
    let exactScores = 0;
    let goalDiff = 0;
    let correctResult = 0;

    const detailedPredictions = userPredictions
      .filter((prediction: any) => {
        const fixture = fixturesById.get(prediction.match_id);
        if (!fixture) return false;

        const match = matchesByApiId.get(fixture.api_fixture_id);
        const kickoff = match?.match_date
          ? new Date(match.match_date)
          : null;
        const statusUpper = (match?.status || "").toUpperCase();
        const hasScores =
          fixture.home_score !== null &&
          fixture.home_score !== undefined &&
          fixture.away_score !== null &&
          fixture.away_score !== undefined;

        return (
          (kickoff !== null && kickoff <= now) ||
          VISIBLE_STATUSES.includes(statusUpper) ||
          hasScores
        );
      })
      .map((prediction: any) => {
        const fixture = fixturesById.get(prediction.match_id);
        const match = matchesByApiId.get(fixture?.api_fixture_id);

        const actualHome =
          fixture?.home_score ??
          match?.home_score ??
          prediction.actual_home_score;
        const actualAway =
          fixture?.away_score ??
          match?.away_score ??
          prediction.actual_away_score;
        const predictedHome = prediction.home_score;
        const predictedAway = prediction.away_score;

        let outcome = "";
        let predictionPoints = 0;

        if (
          actualHome !== null &&
          actualHome !== undefined &&
          actualAway !== null &&
          actualAway !== undefined
        ) {
          if (
            predictedHome === actualHome &&
            predictedAway === actualAway
          ) {
            exactScores++;
            outcome = "Exact Score";
            predictionPoints = POINTS_EXACT;
          } else if (
            actualHome !== actualAway &&
            predictedHome - predictedAway === actualHome - actualAway
          ) {
            goalDiff++;
            outcome = "Correct Goal Difference";
            predictionPoints = POINTS_GOAL_DIFF;
          } else {
            const predictedResult =
              predictedHome > predictedAway
                ? "H"
                : predictedHome < predictedAway
                  ? "A"
                  : "D";
            const actualResult =
              actualHome > actualAway
                ? "H"
                : actualHome < actualAway
                  ? "A"
                  : "D";

            if (predictedResult === actualResult) {
              correctResult++;
              outcome = "Correct Result";
              predictionPoints = POINTS_RESULT;
            } else {
              outcome = "Incorrect";
            }
          }
        }

        totalPoints += predictionPoints;

        return {
          matchId: prediction.match_id,
          homeTeam: fixture?.home_team_name || match?.home_team || "?",
          awayTeam: fixture?.away_team_name || match?.away_team || "?",
          matchDate: match?.match_date,
          predictedHome,
          predictedAway,
          actualHome,
          actualAway,
          points: predictionPoints,
          outcome,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );

    return {
      userId: member.user_id,
      username,
      points: totalPoints,
      exactScores,
      goalDiff,
      correctResult,
      predictions: detailedPredictions,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactScores !== a.exactScores) {
      return b.exactScores - a.exactScores;
    }
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.correctResult !== a.correctResult) {
      return b.correctResult - a.correctResult;
    }
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-white">{league.name}</h1>
          <p className="text-sm mt-2 text-slate-300">
            Invite code:{" "}
            <span className="font-mono font-bold text-blue-400 tracking-wide">
              {league.invite_code}
            </span>
          </p>

          <Link
            href={`/predictions?league_id=${league.id}&league_name=${encodeURIComponent(league.name)}`}
            className="inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm bg-green-500 hover:bg-green-400 text-slate-900 transition-colors shadow-sm"
          >
            Make predictions
          </Link>
        </div>

        <LeagueStandings standings={standings} currentUserId={user.id} />
      </div>
    </div>
  );
}

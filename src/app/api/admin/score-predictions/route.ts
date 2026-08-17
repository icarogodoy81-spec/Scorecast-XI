import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  const exact = predHome === actualHome && predAway === actualAway;
  if (exact) return 4;

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;

  const predResult = Math.sign(predDiff); // 1 win, 0 draw, -1 loss
  const actualResult = Math.sign(actualDiff);

  if (predResult !== actualResult) return 0;

  // correct result from here on
  if (predDiff === actualDiff && actualResult !== 0) return 3; // correct result + correct goal difference

  return 2; // correct result only
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Find finished fixtures that have goals set
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from("fixtures")
      .select("id, api_fixture_id, home_goals, away_goals, status_short")
      .eq("status_short", "FT")
      .not("home_goals", "is", null)
      .not("away_goals", "is", null);

    if (fixturesError) {
      return NextResponse.json(
        { success: false, message: "Failed to load fixtures", error: fixturesError.message },
        { status: 500 }
      );
    }

    const finishedFixturesFound = finishedFixtures?.length ?? 0;

    if (finishedFixturesFound === 0) {
      return NextResponse.json({
        success: true,
        finishedFixturesFound: 0,
        updatedPredictions: 0,
        scoredMatches: 0,
        message: "No finished fixtures to score.",
      });
    }

    let updatedPredictions = 0;
    let scoredMatches = 0;

    for (const fixture of finishedFixtures) {
      const actualHome = fixture.home_goals as number;
      const actualAway = fixture.away_goals as number;

      // 2. Get unscored predictions for this match
      const { data: predictions, error: predsError } = await supabase
        .from("predictions")
        .select("id, home_score, away_score")
        .eq("match_id", fixture.api_fixture_id)
        .is("scored_at", null);

      if (predsError) {
        console.error(
          "Failed to load predictions for fixture",
          fixture.api_fixture_id,
          predsError.message
        );
        continue;
      }

      if (!predictions || predictions.length === 0) continue;

      for (const pred of predictions) {
        if (pred.home_score === null || pred.away_score === null) continue;

        const points = calculatePoints(
          pred.home_score,
          pred.away_score,
          actualHome,
          actualAway
        );

        const { error: updateError } = await supabase
          .from("predictions")
          .update({
            points,
            actual_home_score: actualHome,
            actual_away_score: actualAway,
            match_status: "FT",
            scored_at: new Date().toISOString(),
          })
          .eq("id", pred.id);

        if (updateError) {
          console.error("Failed to update prediction", pred.id, updateError.message);
          continue;
        }

        updatedPredictions += 1;
      }

      scoredMatches += 1;
    }

    return NextResponse.json({
      success: true,
      finishedFixturesFound,
      updatedPredictions,
      scoredMatches,
      message: "Predictions scored successfully",
    });
  } catch (error: any) {
    console.error("SCORE-PREDICTIONS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected score-predictions error",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

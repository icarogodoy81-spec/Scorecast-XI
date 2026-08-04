"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Fixture = {
  id: number;
  home_team: string;
  away_team: string;
  utcDate: string;
};

type Prediction = {
  id?: string;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
};

export default function BoloesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [savingFixtureId, setSavingFixtureId] = useState<number | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not logged in:", userError);
      setLoading(false);
      return;
    }

    const fixturesResponse = await fetch("/api/fixtures");
    const fixturesData = await fixturesResponse.json();

    const fixturesList: Fixture[] = Array.isArray(fixturesData.matches)
      ? fixturesData.matches
      : [];

    setFixtures(fixturesList);

    const { data: savedPredictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);

    if (predictionsError) {
      console.error("Error loading predictions:", predictionsError);
      setLoading(false);
      return;
    }

    const predictionsMap: Record<number, Prediction> = {};

    savedPredictions?.forEach((prediction: Prediction) => {
      predictionsMap[prediction.match_id] = prediction;
    });

    setPredictions(predictionsMap);
    setLoading(false);
  }

  function updatePrediction(
    matchId: number,
    field: "home_score" | "away_score",
    value: string
  ) {
    const numberValue = value === "" ? 0 : Number(value);

    setPredictions((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        match_id: matchId,
        user_id: current[matchId]?.user_id || "",
        home_score:
          field === "home_score"
            ? numberValue
            : current[matchId]?.home_score ?? 0,
        away_score:
          field === "away_score"
            ? numberValue
            : current[matchId]?.away_score ?? 0,
      },
    }));
  }

  async function savePrediction(matchId: number) {
    setSavingFixtureId(matchId);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not logged in:", userError);
      setSavingFixtureId(null);
      return;
    }

    const prediction = predictions[matchId];

    if (!prediction) {
      setSavingFixtureId(null);
      return;
    }

    const { data, error } = await supabase
      .from("predictions")
      .upsert(
        {
          user_id: user.id,
          match_id: matchId,
          home_score: prediction.home_score,
          away_score: prediction.away_score,
        },
        {
          onConflict: "user_id,match_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving prediction:", error);
      setSavingFixtureId(null);
      return;
    }

    setPredictions((current) => ({
      ...current,
      [matchId]: data,
    }));

    setSavingFixtureId(null);
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading fixtures and saved predictions...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bolões</h1>

      {fixtures.length === 0 && <p>No fixtures found.</p>}

      <div className="space-y-4">
        {fixtures.map((fixture) => {
          const prediction = predictions[fixture.id];

          return (
            <div
              key={fixture.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div>
                <p className="font-semibold">
                  {fixture.home_team} vs {fixture.away_team}
                </p>

                <p className="text-sm text-gray-500">
                  {new Date(fixture.utcDate).toLocaleString("en-GB")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={prediction?.home_score ?? ""}
                  onChange={(event) =>
                    updatePrediction(
                      fixture.id,
                      "home_score",
                      event.target.value
                    )
                  }
                  className="w-20 border rounded px-2 py-1"
                  placeholder="Home"
                />

                <span>-</span>

                <input
                  type="number"
                  min="0"
                  value={prediction?.away_score ?? ""}
                  onChange={(event) =>
                    updatePrediction(
                      fixture.id,
                      "away_score",
                      event.target.value
                    )
                  }
                  className="w-20 border rounded px-2 py-1"
                  placeholder="Away"
                />

                <button
                  onClick={() => savePrediction(fixture.id)}
                  disabled={savingFixtureId === fixture.id}
                  className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
                >
                  {savingFixtureId === fixture.id ? "Saving..." : "Save"}
                </button>
              </div>

              {prediction?.id && (
                <p className="text-sm text-green-600">
                  Saved prediction: {prediction.home_score} -{" "}
                  {prediction.away_score}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

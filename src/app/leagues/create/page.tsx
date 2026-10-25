"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeague } from "@/app/actions/leagues";
import { COMPETITIONS } from "@/lib/competitions";

export default function CreateLeaguePage() {
  const [name, setName] = useState("");
  const [competitionCodes, setCompetitionCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function toggleCompetition(code: string) {
    setCompetitionCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a league name.");
      return;
    }

    if (competitionCodes.length === 0) {
      setError("Please select at least one tournament.");
      return;
    }

    setLoading(true);

    try {
      const result = await createLeague({
        name: trimmedName,
        competition_codes: competitionCodes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data?.id) {
        router.push(`/leagues/${result.data.id}`);
        return;
      }

      setError("The league was not created. Please try again.");
    } catch {
      setError("Could not create the league. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#111c34",
    border: "1px solid #243b63",
    color: "#f8fafc",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Create a League
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="league-name"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              League Name
            </label>
            <input
              id="league-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              placeholder="e.g. Office Footy Pool"
              style={inputStyle}
              className="w-full rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-300">
              Tournaments
            </legend>

            <div className="space-y-2">
              {COMPETITIONS.map((competition) => (
                <label
                  key={competition.code}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#243b63] bg-[#111c34] px-3 py-2 text-sm text-white"
                >
                  <input
                    type="checkbox"
                    checked={competitionCodes.includes(competition.code)}
                    onChange={() => toggleCompetition(competition.code)}
                    className="accent-green-500"
                  />
                  {competition.name}
                </label>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Free supports one tournament per league. Star can combine
              tournaments in one league.
            </p>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create League"}
          </button>
        </form>
      </div>
    </div>
  );
}

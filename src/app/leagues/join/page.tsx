"use client";

import { useState } from "react";
import { joinLeague } from "@/app/actions/leagues";
import { useRouter } from "next/navigation";

export default function JoinLeaguePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await joinLeague(code.trim().toUpperCase());

    if (result.error) {
      setError(result.error);
      setLoading(false);
   } else if (result.data?.id) {
  router.push(`/leagues/${result.data.id}`);
}
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Join a League</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invite Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={6}
            placeholder="ABC123"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join League"}
        </button>
      </form>
    </div>
  );
}

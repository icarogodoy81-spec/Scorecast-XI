"use client";

import { useState } from "react";
import { createLeague } from "@/app/actions/leagues";
import { useRouter } from "next/navigation";

export default function CreateLeaguePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createLeague({ name: name.trim() });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.data?.id) {
      router.push(`/leagues/${result.data.id}`);
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
        <h1 className="text-2xl font-bold mb-6 text-white text-center">
          Create a League
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              League Name
            </label>
            <input
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create League"}
          </button>
        </form>
      </div>
    </div>
  );
}

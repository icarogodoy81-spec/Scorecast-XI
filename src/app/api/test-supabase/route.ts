import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const results: Record<string, unknown> = {};

  const tables = [
    "fixtures",
    "leaderboard",
    "league_members",
    "leagues",
    "matches",
    "predictions",
    "profiles",
    "standings",
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(5);

    results[table] = {
      ok: !error,
      error: error?.message ?? null,
      rows: data ?? [],
    };
  }

  return NextResponse.json(results);
}

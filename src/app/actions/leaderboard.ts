"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recalculateLeaderboard(leagueId: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("recalculate_leaderboard", {
    league_id_param: leagueId,
  });

  if (error) return { error: error.message };

  revalidatePath("/leaderboard");
  return { error: null };
}

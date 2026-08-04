"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateUsername(username: string) {
  if (!username || username.trim().length < 2) {
    return { error: "Username must be at least 2 characters" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ username: username.trim() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}

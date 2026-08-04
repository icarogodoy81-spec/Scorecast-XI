"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLeague(formData: {
  name: string;
  description?: string;
  is_public?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({
      name: formData.name,
      description: formData.description || null,
      cover_url: null,
      owner_id: user.id,
      invite_code: inviteCode,
      is_public: formData.is_public ?? false,
      max_members: 20,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Add owner as member
  await supabase.from("league_members").insert({
    user_id: user.id,
    league_id: league.id,
  });

  revalidatePath("/leagues");
  return { data: league, error: null };
}

export async function joinLeague(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Find league by invite code
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (leagueError || !league) return { error: "Invalid invite code" };

  // Check if already a member
  const { data: existing } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existing) return { error: "Already a member" };

  // Check max members
  const { count } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (league.max_members && count && count >= league.max_members) {
    return { error: "League is full" };
  }

  const { error } = await supabase.from("league_members").insert({
    user_id: user.id,
    league_id: league.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/leagues");
  return { data: league, error: null };
}

export async function leaveLeague(leagueId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/leagues");
  return { error: null };
}

export async function deleteLeague(leagueId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: league } = await supabase
    .from("leagues")
    .select("owner_id")
    .eq("id", leagueId)
    .single();

  if (!league || league.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId);

  if (error) return { error: error.message };

  revalidatePath("/leagues");
  return { error: null };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PlanKey = "free" | "gold" | "star";

async function checkLeagueCreationLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: entitlement, error: entitlementError } = await supabase
    .from("user_entitlements")
    .select("plan_key, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (entitlementError) {
    return "Could not verify your membership plan. Please try again.";
  }

  const entitlementIsActive =
    entitlement?.status === "active" &&
    (!entitlement.expires_at ||
      new Date(entitlement.expires_at).getTime() > Date.now());

  const plan: PlanKey =
    entitlementIsActive &&
    (entitlement.plan_key === "gold" || entitlement.plan_key === "star")
      ? entitlement.plan_key
      : "free";

  if (plan !== "free") {
    return null;
  }

  // Count leagues this user owns, not leagues they have joined.
  const { count, error: leagueError } = await supabase
    .from("leagues")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (leagueError) {
    return "Could not verify your league limit. Please try again.";
  }

  if ((count ?? 0) >= 1) {
    return "Your Free plan includes access to one league. Want to create or join more? Explore our Gold and Star plans on the Plans & Membership page!";
  }

  return null;
}

export async function createLeague(formData: {
  name: string;
  description?: string;
  is_public?: boolean;
  competition_code?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const accessError = await checkLeagueCreationLimit(supabase, user.id);
  if (accessError) return { error: accessError };

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
      competition_code: formData.competition_code || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { error: memberError } = await supabase.from("league_members").insert({
    user_id: user.id,
    league_id: league.id,
  });

  if (memberError) {
    await supabase.from("leagues").delete().eq("id", league.id);
    return { error: memberError.message };
  }

  revalidatePath("/leagues");
  return { data: league, error: null };
}

export async function joinLeague(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (leagueError || !league) return { error: "Invalid invite code" };

  const { data: existing, error: existingError } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (existing) return { error: "Already a member" };

  const { count, error: countError } = await supabase
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (countError) return { error: countError.message };

  if (league.max_members && (count ?? 0) >= league.max_members) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

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

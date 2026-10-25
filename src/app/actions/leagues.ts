"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PlanKey = "free" | "star";

async function getActivePlan(
  userId: string
): Promise<{ plan: PlanKey | null; error: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("getActivePlan: Supabase server environment variables are missing.");

    return {
      plan: null,
      error: "Could not verify your membership plan. Please try again.",
    };
  }

  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: entitlement, error } = await supabaseAdmin
    .from("user_entitlements")
    .select("plan_key, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getActivePlan: failed to read user_entitlements", {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return {
      plan: null,
      error: "Could not verify your membership plan. Please try again.",
    };
  }

  const isActive =
    entitlement?.status === "active" &&
    (!entitlement.expires_at ||
      new Date(entitlement.expires_at).getTime() > Date.now());

  return {
    plan: isActive && entitlement?.plan_key === "star" ? "star" : "free",
    error: null,
  };
}

async function checkLeagueAccessLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  plan: PlanKey
): Promise<string | null> {
  if (plan === "star") {
    return null;
  }

  const { count, error } = await supabase
    .from("league_members")
    .select("league_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    return "Could not verify your league access. Please try again.";
  }

  if ((count ?? 0) >= 1) {
    return "The Free plan includes one league. To create or join more, explore Star on the Plans & Membership page.";
  }

  return null;
}

export async function createLeague(formData: {
  name: string;
  description?: string;
  is_public?: boolean;
  competition_code?: string;
  competition_codes?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { plan, error: planError } = await getActivePlan(user.id);
  if (planError || !plan) {
    return { error: planError ?? "Could not verify your membership plan. Please try again." };
  }

  const accessError = await checkLeagueAccessLimit(supabase, user.id, plan);
  if (accessError) return { error: accessError };

  const competitionCodes = [
    ...new Set(
      (formData.competition_codes?.length
        ? formData.competition_codes
        : formData.competition_code
          ? [formData.competition_code]
          : []
      )
        .map((code) => code.trim())
        .filter(Boolean)
    ),
  ];

  if (competitionCodes.length === 0) {
    return { error: "Please select at least one tournament." };
  }

  if (plan !== "star" && competitionCodes.length > 1) {
    return {
      error: "Combining multiple tournaments in one league is available on Star.",
    };
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      cover_url: null,
      owner_id: user.id,
      invite_code: inviteCode,
      is_public: formData.is_public ?? false,
      max_members: 20,
      competition_code: competitionCodes[0],
    })
    .select()
    .single();

  if (leagueError || !league) {
    return { error: leagueError?.message ?? "Could not create the league." };
  }

  const { error: competitionsError } = await supabase
    .from("league_competitions")
    .insert(
      competitionCodes.map((competitionCode) => ({
        league_id: league.id,
        competition_code: competitionCode,
        added_by: user.id,
      }))
    );

  if (competitionsError) {
    await supabase.from("leagues").delete().eq("id", league.id);
    return { error: competitionsError.message };
  }

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
    .eq("invite_code", inviteCode.trim().toUpperCase())
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

  const { plan, error: planError } = await getActivePlan(user.id);
  if (planError || !plan) {
    return { error: planError ?? "Could not verify your membership plan. Please try again." };
  }

  const accessError = await checkLeagueAccessLimit(supabase, user.id, plan);
  if (accessError) return { error: accessError };

  const { count, error: countError } = await supabase
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (countError) return { error: countError.message };

  if (league.max_members && (count ?? 0) >= league.max_members) {
    return { error: "League is full" };
  }

  const { error: memberError } = await supabase.from("league_members").insert({
    user_id: user.id,
    league_id: league.id,
  });

  if (memberError) return { error: memberError.message };

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

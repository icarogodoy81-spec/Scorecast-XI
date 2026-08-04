import { createClient } from "@/utils/supabase/server";

export type Match = {
  id: string | number;
  home_team?: string | null;
  away_team?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  kickoff_time?: string | null;
  kickoffTime?: string | null;
  date?: string | null;
  status?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
};

export async function getAllMatches(): Promise<{
  data: Match[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("matches").select("*");

  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }

  const matches = (data ?? []) as Match[];

  matches.sort((a, b) => {
    const dateA = a.kickoff_time ?? a.kickoffTime ?? a.date ?? "";
    const dateB = b.kickoff_time ?? b.kickoffTime ?? b.date ?? "";

    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return {
    data: matches,
    error: null,
  };
}

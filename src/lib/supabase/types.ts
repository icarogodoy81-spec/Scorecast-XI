export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface League {
  id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  invite_code: string;
  is_public: boolean | null;
  max_members: number | null;
  created_at: string | null;
}

export interface LeagueMember {
  user_id: string;
  league_id: number;
  joined_at: string | null;
}

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Match {
  id: number;
  league_id: number;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  kick_off: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus | null;
  api_football_id: number | null;
  league_api_id: number | null;
  season: number | null;
  created_at: string | null;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeaderboardEntry {
  id: number;
  league_id: number;
  user_id: string;
  total_points: number;
  position: number | null;
}

export interface Standing {
  id: number;
  league_id: number;
  season: number;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  rank: number | null;
  points: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  updated_at: string | null;
}

export interface MatchWithPrediction extends Match {
  prediction: Prediction | null;
}

export interface LeagueWithMemberCount extends League {
  member_count: number;
  is_member?: boolean;
}

export interface LeaderboardWithProfile extends LeaderboardEntry {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

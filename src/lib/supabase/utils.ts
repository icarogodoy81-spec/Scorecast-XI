export function calculatePoints(
  prediction: { home_score: number; away_score: number },
  result: { home_score: number; away_score: number }
): number {
  if (
    prediction.home_score === result.home_score &&
    prediction.away_score === result.away_score
  ) {
    return 4;
  }

  const predSign = Math.sign(prediction.home_score - prediction.away_score);
  const actualSign = Math.sign(result.home_score - result.away_score);

  if (predSign === actualSign) {
    const predDiff = Math.abs(prediction.home_score - prediction.away_score);
    const actualDiff = Math.abs(result.home_score - result.away_score);

    if (predDiff === actualDiff) return 3;
    return 2;
  }

  return 0;
}

export function canPredict(match: { kick_off: string; status: string | null }): boolean {
  return match.status === "scheduled" && new Date(match.kick_off) > new Date();
}

export function formatKickOff(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getPositionEmoji(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}

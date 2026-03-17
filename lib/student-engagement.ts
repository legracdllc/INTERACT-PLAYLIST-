export type EngagementItem = {
  id: string;
  skill_name: string | null;
  teks: string | null;
  xp: number | null;
};

export type EngagementProgress = {
  daily_playlist_item_id: string;
  status: string;
  score: number | null;
  evidence_url: string | null;
  submitted_at?: string | null;
};

export type WeeklyProgress = {
  status: string;
  score: number | null;
  updated_at: string;
  item: { skill_name: string | null; teks: string | null } | null;
  daily: { date: string } | null;
  evidence_url?: string | null;
};

export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewardXp: number;
  rewardCoins: number;
  complete: boolean;
};

export type PowerUpCard = {
  id: string;
  title: string;
  effect: string;
  flavor: string;
  state: "ready" | "charging" | "active";
};

export type MissionBadge = {
  id: string;
  title: string;
  flavor: string;
  earned: boolean;
};

function isComplete(status: string) {
  return status === "submitted" || status === "graded";
}

function uniqueSortedDates(dateStrings: string[]) {
  return [...new Set(dateStrings.filter(Boolean))].sort((a, b) => b.localeCompare(a));
}

export function computeStreakDays(dateStrings: string[], today: string) {
  const dates = new Set(uniqueSortedDates(dateStrings));
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00`);

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computePlaylistCombo(items: EngagementItem[], progressRows: EngagementProgress[]) {
  const progressByItem = new Map(progressRows.map((row) => [row.daily_playlist_item_id, row]));
  let combo = 0;

  for (const item of items) {
    const row = progressByItem.get(item.id);
    if (row && isComplete(row.status)) {
      combo += 1;
      continue;
    }
    break;
  }

  return combo;
}

export function getNextQuestItem(items: EngagementItem[], progressRows: EngagementProgress[]) {
  const progressByItem = new Map(progressRows.map((row) => [row.daily_playlist_item_id, row]));
  return items.find((item) => {
    const row = progressByItem.get(item.id);
    return !row || !isComplete(row.status);
  }) ?? null;
}

export function buildMissionCoach(params: {
  items: EngagementItem[];
  progressRows: EngagementProgress[];
  today: string;
  recentDates: string[];
}) {
  const { items, progressRows, today, recentDates } = params;
  const completedCount = progressRows.filter((row) => isComplete(row.status)).length;
  const total = items.length;
  const streak = computeStreakDays(recentDates, today);
  const combo = computePlaylistCombo(items, progressRows);
  const nextQuest = getNextQuestItem(items, progressRows);
  const evidenceCount = progressRows.filter((row) => Boolean(row.evidence_url?.trim())).length;

  if (!total) {
    return {
      headline: "Mission board is waiting for your teacher",
      message: "As soon as a playlist opens, your lion hero can jump into action.",
      badge: "Stand by",
      streak,
      combo,
      evidenceCount,
      nextQuestLabel: "No mission yet",
    };
  }

  if (completedCount === total) {
    return {
      headline: "Poster board cleared",
      message: evidenceCount === total
        ? "You finished every level and showed your work like a real math champion."
        : "You finished every level. Add show-your-work notes to strengthen your leaderboard finish.",
      badge: "Victory mode",
      streak,
      combo,
      evidenceCount,
      nextQuestLabel: "Mission complete",
    };
  }

  if (completedCount === 0) {
    return {
      headline: "Start with one strong win",
      message: nextQuest
        ? `Open ${nextQuest.skill_name ?? "the first activity"} first. One finished level builds momentum fast.`
        : "Pick your first poster level and wake up your combo meter.",
      badge: "First step",
      streak,
      combo,
      evidenceCount,
      nextQuestLabel: nextQuest?.skill_name ?? "First mission",
    };
  }

  const remaining = total - completedCount;
  return {
    headline: combo >= 2 ? "Combo streak is live" : "Momentum is building",
    message: nextQuest
      ? `${remaining} level${remaining === 1 ? "" : "s"} left. Next best move: ${nextQuest.skill_name ?? "keep pushing"}`
      : "Keep going. You are close to clearing the full board.",
    badge: combo >= 2 ? "Hot streak" : "Keep climbing",
    streak,
    combo,
    evidenceCount,
    nextQuestLabel: nextQuest?.skill_name ?? "Keep going",
  };
}

export function buildDailyChallenges(items: EngagementItem[], progressRows: EngagementProgress[]) {
  const completedRows = progressRows.filter((row) => isComplete(row.status));
  const evidenceRows = progressRows.filter((row) => Boolean(row.evidence_url?.trim()));
  const gradedRows = progressRows.filter((row) => typeof row.score === "number");
  const combo = computePlaylistCombo(items, progressRows);
  const score80 = gradedRows.filter((row) => (row.score ?? 0) >= 80).length;

  const challengeDefs: DailyChallenge[] = [
    {
      id: "clear-three",
      title: "Triple Poster Push",
      description: "Finish 3 levels today.",
      progress: completedRows.length,
      goal: Math.min(3, Math.max(items.length, 1)),
      rewardXp: 35,
      rewardCoins: 20,
      complete: completedRows.length >= Math.min(3, Math.max(items.length, 1)),
    },
    {
      id: "show-your-work",
      title: "Math Proof Hero",
      description: "Add show-your-work to 2 levels.",
      progress: evidenceRows.length,
      goal: Math.min(2, Math.max(items.length, 1)),
      rewardXp: 25,
      rewardCoins: 15,
      complete: evidenceRows.length >= Math.min(2, Math.max(items.length, 1)),
    },
    {
      id: "combo-run",
      title: "Combo Run",
      description: "Clear 2 levels in order without breaking your streak.",
      progress: combo,
      goal: Math.min(2, Math.max(items.length, 1)),
      rewardXp: 30,
      rewardCoins: 10,
      complete: combo >= Math.min(2, Math.max(items.length, 1)),
    },
    {
      id: "score-spark",
      title: "Score Spark",
      description: "Earn 80+ on a graded activity.",
      progress: score80,
      goal: Math.min(1, Math.max(items.length, 1)),
      rewardXp: 40,
      rewardCoins: 25,
      complete: score80 >= 1,
    },
  ];

  return challengeDefs;
}

export function buildPowerUps(params: {
  streak: number;
  combo: number;
  evidenceCount: number;
  completedCount: number;
  totalCount: number;
}) {
  const { streak, combo, evidenceCount, completedCount, totalCount } = params;

  const powerUps: PowerUpCard[] = [
    {
      id: "streak-shield",
      title: "Streak Shield",
      effect: "Keep your learning streak alive by finishing at least one level.",
      flavor: "Your lion glows brighter every day you show up.",
      state: streak >= 2 ? "active" : "ready",
    },
    {
      id: "combo-boots",
      title: "Combo Boots",
      effect: "Clear levels in order to charge a faster mission run.",
      flavor: "Step-by-step victories build your speed power.",
      state: combo >= 2 ? "active" : completedCount > 0 ? "charging" : "ready",
    },
    {
      id: "proof-lantern",
      title: "Proof Lantern",
      effect: "Add show-your-work notes to shine on the leaderboard.",
      flavor: "Teachers can see your thinking, not just your finish line.",
      state: evidenceCount >= 1 ? "active" : "ready",
    },
    {
      id: "boss-key",
      title: "Boss Key",
      effect: "Clear the whole board to unlock full-mission victory mode.",
      flavor: "Finish every poster level and open the champion gate.",
      state: totalCount > 0 && completedCount === totalCount ? "active" : completedCount > 0 ? "charging" : "ready",
    },
  ];

  return powerUps;
}

export function buildMissionBadges(params: {
  streak: number;
  combo: number;
  evidenceCount: number;
  completedCount: number;
  totalCount: number;
}) {
  const { streak, combo, evidenceCount, completedCount, totalCount } = params;

  const badges: MissionBadge[] = [
    {
      id: "starter-spark",
      title: "Starter Spark",
      flavor: "You jumped into the mission board.",
      earned: completedCount >= 1,
    },
    {
      id: "combo-captain",
      title: "Combo Captain",
      flavor: "You cleared levels in order like a pro.",
      earned: combo >= 2,
    },
    {
      id: "proof-master",
      title: "Proof Master",
      flavor: "You showed your math thinking clearly.",
      earned: evidenceCount >= 2,
    },
    {
      id: "streak-keeper",
      title: "Streak Keeper",
      flavor: "You kept your mission streak alive.",
      earned: streak >= 2,
    },
    {
      id: "board-clearer",
      title: "Board Clearer",
      flavor: "You cleared the whole mission board.",
      earned: totalCount > 0 && completedCount === totalCount,
    },
  ];

  return badges;
}

export function buildWeeklyMomentum(rows: WeeklyProgress[], today: string) {
  const completed = rows.filter((row) => isComplete(row.status));
  const gradedScores = completed
    .map((row) => (typeof row.score === "number" ? row.score : null))
    .filter((value): value is number => value !== null);
  const avgScore = gradedScores.length
    ? Math.round(gradedScores.reduce((sum, value) => sum + value, 0) / gradedScores.length)
    : null;
  const evidenceCount = rows.filter((row) => Boolean(row.evidence_url?.trim())).length;
  const streak = computeStreakDays(
    rows.map((row) => row.daily?.date ?? "").filter(Boolean),
    today,
  );

  const teksCount = new Map<string, number>();
  for (const row of completed) {
    const teks = row.item?.teks?.trim();
    if (teks) {
      teksCount.set(teks, (teksCount.get(teks) ?? 0) + 1);
    }
  }
  const topSkill = [...teksCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    completedCount: completed.length,
    avgScore,
    evidenceCount,
    streak,
    topSkill,
  };
}

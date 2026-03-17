type RewardStateShape = {
  daily_badges?: Record<string, string[]>;
  opened_chests?: Record<string, boolean>;
};

export type PersistedRewardState = {
  earnedBadgeIds: string[];
  chestOpened: boolean;
};

export type RewardHistorySummary = {
  totalBadges: number;
  badgeIds: string[];
  openedChestCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRoot(settingsJson: unknown): RewardStateShape {
  if (!isRecord(settingsJson)) {
    return {};
  }

  const rewards = settingsJson.game_rewards;
  if (!isRecord(rewards)) {
    return {};
  }

  return rewards as RewardStateShape;
}

export function getPersistedRewardState(settingsJson: unknown, dailyId: string): PersistedRewardState {
  const root = getRoot(settingsJson);
  const earnedBadgeIds = Array.isArray(root.daily_badges?.[dailyId])
    ? root.daily_badges?.[dailyId]?.filter((value): value is string => typeof value === "string") ?? []
    : [];
  const chestOpened = Boolean(root.opened_chests?.[dailyId]);

  return { earnedBadgeIds, chestOpened };
}

export function mergePersistedRewardState(params: {
  settingsJson: unknown;
  dailyId: string;
  earnedBadgeIds: string[];
  chestOpened: boolean;
}) {
  const { settingsJson, dailyId, earnedBadgeIds, chestOpened } = params;
  const safeSettings = isRecord(settingsJson) ? settingsJson : {};
  const root = getRoot(settingsJson);

  return {
    ...safeSettings,
    game_rewards: {
      ...root,
      daily_badges: {
        ...(root.daily_badges ?? {}),
        [dailyId]: earnedBadgeIds,
      },
      opened_chests: {
        ...(root.opened_chests ?? {}),
        [dailyId]: chestOpened,
      },
    },
  };
}

export function getRewardHistorySummary(settingsJson: unknown): RewardHistorySummary {
  const root = getRoot(settingsJson);
  const badgeIds = [...new Set(
    Object.values(root.daily_badges ?? {})
      .flatMap((value) => Array.isArray(value) ? value : [])
      .filter((value): value is string => typeof value === "string"),
  )];
  const openedChestCount = Object.values(root.opened_chests ?? {}).filter(Boolean).length;

  return {
    totalBadges: badgeIds.length,
    badgeIds,
    openedChestCount,
  };
}

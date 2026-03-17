"use client";

import { useMemo, useState } from "react";
import { PosterCelebration } from "@/components/poster-celebration";
import { StudentAvatarRenderer } from "@/components/student-avatar-renderer";
import {
  buildDailyChallenges,
  buildMissionBadges,
  buildMissionCoach,
  buildPowerUps,
  computePlaylistCombo,
} from "@/lib/student-engagement";
import type { MissionTheme } from "@/lib/mission-theme";

type PlaylistItem = {
  id: string;
  order_index: number;
  skill_name: string | null;
  teks: string | null;
  type: string | null;
  url: string | null;
  xp: number | null;
  max_score: number | null;
};

type ProgressRecord = {
  id: string;
  daily_playlist_item_id: string;
  status: string;
  score: number | null;
  evidence_url: string | null;
  submitted_at?: string | null;
};

const mascotStyles = [
  "bg-gradient-to-br from-cyan-300 to-blue-500",
  "bg-gradient-to-br from-pink-300 to-fuchsia-500",
  "bg-gradient-to-br from-lime-300 to-emerald-500",
  "bg-gradient-to-br from-amber-300 to-orange-500",
];

function statusClass(status: string) {
  return `status-pill status-${status}`;
}

export function StudentDailyClient({
  dailyId,
  items,
  progressRows,
  avatar,
  xp = 0,
  coins = 0,
  today,
  initialEarnedBadgeIds = [],
  initialChestOpened = false,
  missionTheme,
}: {
  dailyId: string;
  items: PlaylistItem[];
  progressRows: ProgressRecord[];
  avatar: unknown;
  xp?: number;
  coins?: number;
  today: string;
  initialEarnedBadgeIds?: string[];
  initialChestOpened?: boolean;
  missionTheme: MissionTheme;
}) {
  const [progressMap, setProgressMap] = useState(() => {
    const map = new Map<string, ProgressRecord>();
    for (const row of progressRows) {
      map.set(row.daily_playlist_item_id, row);
    }
    return map;
  });
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, string>>(
    () => Object.fromEntries(progressRows.map((row) => [row.daily_playlist_item_id, row.evidence_url ?? ""])),
  );
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>(initialEarnedBadgeIds);
  const [chestOpened, setChestOpened] = useState<boolean>(initialChestOpened);

  const completedCount = useMemo(
    () =>
      items.filter((item) => {
        const row = progressMap.get(item.id);
        return row?.status === "submitted" || row?.status === "graded";
      }).length,
    [items, progressMap],
  );

  const progressRowsLive = useMemo(() => [...progressMap.values()], [progressMap]);
  const coach = useMemo(
    () =>
      buildMissionCoach({
        items,
        progressRows: progressRowsLive,
        today,
        recentDates: progressRowsLive
          .map((row) => row.submitted_at?.slice(0, 10) ?? "")
          .filter(Boolean),
      }),
    [items, progressRowsLive, today],
  );
  const combo = useMemo(() => computePlaylistCombo(items, progressRowsLive), [items, progressRowsLive]);
  const challenges = useMemo(() => buildDailyChallenges(items, progressRowsLive), [items, progressRowsLive]);
  const powerUps = useMemo(
    () =>
      buildPowerUps({
        streak: coach.streak,
        combo,
        evidenceCount: coach.evidenceCount,
        completedCount,
        totalCount: items.length,
      }),
    [coach.evidenceCount, coach.streak, combo, completedCount, items.length],
  );
  const badges = useMemo(
    () =>
      buildMissionBadges({
        streak: coach.streak,
        combo,
        evidenceCount: coach.evidenceCount,
        completedCount,
        totalCount: items.length,
      }),
    [coach.evidenceCount, coach.streak, combo, completedCount, items.length],
  );

  async function saveStatus(itemId: string, status: "in_progress" | "submitted", evidenceUrl?: string) {
    setLoadingItem(itemId);
    const res = await fetch("/api/student/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyId, itemId, status, evidenceUrl: evidenceUrl?.trim() || undefined }),
    });

    if (res.ok) {
      const payload = await res.json();
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(itemId, payload.progress);
        return next;
      });
      if (payload.progress?.evidence_url) {
        setEvidenceMap((prev) => ({ ...prev, [itemId]: payload.progress.evidence_url }));
      }
      if (Array.isArray(payload.rewardState?.earnedBadgeIds)) {
        setEarnedBadgeIds(payload.rewardState.earnedBadgeIds.filter((value: unknown): value is string => typeof value === "string"));
      }
      if (typeof payload.rewardState?.chestOpened === "boolean") {
        setChestOpened(payload.rewardState.chestOpened);
      }
    }

    setLoadingItem(null);
  }

  const totalXp = items.reduce((sum, item) => sum + (item.xp ?? 10), 0);
  const allClear = items.length > 0 && completedCount === items.length;

  return (
    <div className={`space-y-4 ${missionTheme.rootClassName}`}>
      <div className="panel game-shell mission-hud p-5">
        <PosterCelebration active={allClear} title="Board Cleared!" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <StudentAvatarRenderer avatar={avatar} size="sm" showLabel name="Hero" xp={xp} />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Hero Mission Board</p>
              <p className="mt-1 text-2xl font-extrabold">{completedCount} / {items.length} worlds cleared</p>
              <p className="mt-1 text-sm text-indigo-100/80">{missionTheme.title}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="kid-stat-pill">
              Total XP: <span className="font-extrabold text-amber-300">{totalXp}</span>
            </div>
            <div className="kid-stat-pill">
              Coins: <span className="font-extrabold text-lime-300">{coins}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-3 h-4 rounded-full bg-indigo-950/70">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-lime-300 to-cyan-300"
            style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1.4fr,0.8fr,0.8fr]">
        <article className="panel panel-playful coach-card p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{coach.badge}</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-white">{coach.headline}</h3>
          <p className="mt-2 text-sm text-indigo-100/90">{coach.message}</p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-mission">Next up: {coach.nextQuestLabel}</span>
            <span className="poster-chip poster-chip-star">Evidence: {coach.evidenceCount}</span>
            <span className="poster-chip poster-chip-math">{missionTheme.title}</span>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">{missionTheme.flavor}</p>
        </article>
        <article className="panel panel-playful mini-score-card p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Streak Power</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-amber-300">{coach.streak}</p>
          <p className="mt-1 text-sm text-indigo-100/85">days in a row making progress</p>
        </article>
        <article className="panel panel-playful mini-score-card p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Combo Meter</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-lime-300">{combo}</p>
          <p className="mt-1 text-sm text-indigo-100/85">worlds cleared in order</p>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.15fr,0.85fr]">
        <article className="panel panel-playful challenge-board p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Daily Challenges</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-white">Bonus Missions</h3>
            </div>
            <span className="poster-chip poster-chip-star">
              {challenges.filter((challenge) => challenge.complete).length}/{challenges.length} complete
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {challenges.map((challenge) => {
              const width = challenge.goal ? Math.min((challenge.progress / challenge.goal) * 100, 100) : 0;
              return (
                <div key={challenge.id} className={challenge.complete ? "challenge-card challenge-card-complete" : "challenge-card"}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="challenge-card-title">{challenge.title}</p>
                      <p className="challenge-card-description">{challenge.description}</p>
                    </div>
                    <span className="challenge-card-progress">{challenge.progress}/{challenge.goal}</span>
                  </div>
                  <div className="challenge-progress-track">
                    <div className="challenge-progress-fill" style={{ width: `${width}%` }} />
                  </div>
                  <div className="poster-chip-row">
                    <span className="poster-chip poster-chip-math">+{challenge.rewardXp} XP</span>
                    <span className="poster-chip poster-chip-mission">+{challenge.rewardCoins} coins</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel panel-playful powerup-board p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Power-Ups</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-white">Hero Boosts</h3>
          <div className="mt-4 space-y-3">
            {powerUps.map((powerUp) => (
              <div key={powerUp.id} className={`powerup-card powerup-${powerUp.state}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="powerup-title">{powerUp.title}</p>
                  <span className="powerup-state">{powerUp.state}</span>
                </div>
                <p className="mt-2 text-sm text-indigo-100/90">{powerUp.effect}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">{powerUp.flavor}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr,0.9fr]">
        <article className="panel panel-playful mission-map-board p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Mission Map</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-white">World Path</h3>
            </div>
            <span className="poster-chip poster-chip-mission">{completedCount}/{items.length} cleared</span>
          </div>
          <div className="mission-map mt-5">
            {items.map((item, index) => {
              const row = progressMap.get(item.id);
              const done = row?.status === "submitted" || row?.status === "graded";
              const active = !done && index === completedCount;
              return (
                <div key={item.id} className={done ? "mission-node mission-node-done" : active ? "mission-node mission-node-active" : "mission-node"}>
                  <span className="mission-node-ring" />
                  <span className="mission-node-number">{index + 1}</span>
                  <span className="mission-node-label">{item.skill_name ?? `World ${index + 1}`}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel panel-playful badge-board p-4">
          <div className="math-corner-doodles" aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Badge Case</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-white">Today&apos;s Badges</h3>
            </div>
            <span className="poster-chip poster-chip-star">{badges.filter((badge) => badge.earned).length}/{badges.length}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div key={badge.id} className={badge.earned || earnedBadgeIds.includes(badge.id) ? "mission-badge mission-badge-earned" : "mission-badge"}>
                <div className="mission-badge-medal" />
                <div>
                  <p className="mission-badge-title">{badge.title}</p>
                  <p className="mission-badge-flavor">{badge.flavor}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {items.map((item, index) => {
        const row = progressMap.get(item.id);
        const status = row?.status ?? "not_started";
        const evidenceValue = evidenceMap[item.id] ?? "";
        const hasEvidence = Boolean(evidenceValue.trim() || row?.evidence_url?.trim());

        return (
          <article key={item.id} className="panel quest-world-card p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className={`mascot ${mascotStyles[index % mascotStyles.length]}`}>
                  <div className="mascot-mouth" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">World {index + 1} - {item.type ?? "activity"}</p>
                  <h3 className="font-display text-xl font-bold text-white">{item.skill_name ?? "Untitled Activity"}</h3>
                  <p className="text-sm text-indigo-100/90">TEKS: {item.teks ?? "-"} | XP: {item.xp ?? 10}</p>
                  <div className="poster-chip-row">
                    <span className="poster-chip poster-chip-mission">{status === "not_started" ? "Ready to blast off" : status.replace("_", " ")}</span>
                    <span className="poster-chip poster-chip-star">{hasEvidence ? "Proof power loaded" : "Add your thinking"}</span>
                  </div>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-cyan-300 underline">Launch Math World</a>
                  ) : null}
                </div>
              </div>
              <p className={statusClass(status)}>{status.replace("_", " ")}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingItem === item.id}
                onClick={() => saveStatus(item.id, "in_progress")}
                className="btn border border-white/20 bg-white/10 text-white"
              >
                Start Mission
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Show Your Work Link Or Idea Note</label>
              <input
                value={evidenceValue}
                onChange={(event) => setEvidenceMap((prev) => ({ ...prev, [item.id]: event.target.value }))}
                placeholder="paste a link or short note"
                className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                disabled={loadingItem === item.id}
                onClick={() => saveStatus(item.id, "submitted", evidenceValue)}
                className="btn btn-primary mt-3"
              >
                Finish Mission + Show Work
              </button>
            </div>
          </article>
        );
      })}

      {allClear || chestOpened ? (
        <div className="panel reward-chest-panel p-5 text-lime-100">
          <div className="reward-chest" aria-hidden="true" />
          <div className="relative z-10 ml-24">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Treasure Unlocked</p>
            <p className="font-display text-2xl font-extrabold">Mission Clear. Reward chest opened.</p>
            <p className="mt-2 text-sm text-indigo-100/90">
              Your lion hero cleared every world on this board. Check your badges, coins, XP, and podium rank.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

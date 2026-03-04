"use client";

import { useMemo, useState } from "react";

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
}: {
  dailyId: string;
  items: PlaylistItem[];
  progressRows: ProgressRecord[];
}) {
  const [progressMap, setProgressMap] = useState(() => {
    const map = new Map<string, ProgressRecord>();
    for (const row of progressRows) map.set(row.daily_playlist_item_id, row);
    return map;
  });
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const completedCount = useMemo(() => {
    return items.filter((item) => {
      const row = progressMap.get(item.id);
      return row?.status === "submitted" || row?.status === "graded";
    }).length;
  }, [items, progressMap]);

  async function saveStatus(itemId: string, status: "in_progress" | "submitted", evidenceUrl?: string) {
    setLoadingItem(itemId);
    const res = await fetch("/api/student/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyId, itemId, status, evidenceUrl }),
    });

    if (res.ok) {
      const payload = await res.json();
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(itemId, payload.progress);
        return next;
      });
    }

    setLoadingItem(null);
  }

  const totalXp = items.reduce((sum, item) => sum + (item.xp ?? 10), 0);

  return (
    <div className="space-y-4">
      <div className="panel game-shell p-5">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Daily Progress</p>
            <p className="mt-1 text-2xl font-extrabold">{completedCount} / {items.length} levels done</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm">
            Total XP: <span className="font-extrabold text-amber-300">{totalXp}</span>
          </div>
        </div>
        <div className="relative z-10 mt-3 h-4 rounded-full bg-indigo-950/70">
          <div className="h-4 rounded-full bg-gradient-to-r from-lime-300 to-cyan-300" style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {items.map((item, index) => {
        const row = progressMap.get(item.id);
        const status = row?.status ?? "not_started";

        return (
          <article key={item.id} className="panel p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className={`mascot ${mascotStyles[index % mascotStyles.length]}`}>
                  <div className="mascot-mouth" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">World {index + 1} - {item.type ?? "activity"}</p>
                  <h3 className="font-display text-xl font-bold text-white">{item.skill_name ?? "Untitled Activity"}</h3>
                  <p className="text-sm text-indigo-100/90">TEKS: {item.teks ?? "-"} | XP: {item.xp ?? 10}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-cyan-300 underline">Launch Activity</a>
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
                Start Quest
              </button>
              <button
                type="button"
                disabled={loadingItem === item.id}
                onClick={() => saveStatus(item.id, "submitted")}
                className="btn btn-primary"
              >
                Submit Score
              </button>
            </div>
          </article>
        );
      })}

      {items.length > 0 && completedCount === items.length ? (
        <div className="panel border-lime-200/40 bg-gradient-to-r from-lime-400/20 to-cyan-400/20 p-4 text-lime-100">
          <p className="font-display text-xl font-extrabold">Level Clear. Daily playlist complete.</p>
        </div>
      ) : null}
    </div>
  );
}

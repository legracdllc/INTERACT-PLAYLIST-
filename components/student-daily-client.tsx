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

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Daily Progress</p>
        <p className="mt-1 text-lg font-bold">{completedCount} / {items.length} submitted</p>
        <div className="mt-3 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {items.map((item, index) => {
        const row = progressMap.get(item.id);
        const status = row?.status ?? "not_started";

        return (
          <article key={item.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Level {index + 1} - {item.type ?? "activity"}</p>
                <h3 className="font-display text-xl font-bold">{item.skill_name ?? "Untitled Activity"}</h3>
                <p className="text-sm text-slate-600">TEKS: {item.teks ?? "-"} | XP: {item.xp ?? 10}</p>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-sky-700 underline">Open Activity Link</a>
                ) : null}
              </div>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{status}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingItem === item.id}
                onClick={() => saveStatus(item.id, "in_progress")}
                className="btn border border-slate-200 bg-white"
              >
                Start
              </button>
              <button
                type="button"
                disabled={loadingItem === item.id}
                onClick={() => saveStatus(item.id, "submitted")}
                className="btn btn-primary"
              >
                Submit
              </button>
            </div>
          </article>
        );
      })}

      {items.length > 0 && completedCount === items.length ? (
        <div className="panel border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-display text-xl font-extrabold">Playlist Complete. Nice work.</p>
        </div>
      ) : null}
    </div>
  );
}

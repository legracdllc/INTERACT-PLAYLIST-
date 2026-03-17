import Link from "next/link";
import { subDays, format } from "date-fns";
import { getUserAndProfile } from "@/lib/auth";
import { buildWeeklyMomentum } from "@/lib/student-engagement";
import { createServiceClient } from "@/lib/supabase/service";
import { getRewardHistorySummary } from "@/lib/student-reward-state";
import { STORE_ITEMS } from "@/lib/store";

type ProgressRow = {
  status: string;
  score: number | null;
  updated_at: string;
  evidence_url: string | null;
  daily_playlist_items: { skill_name: string | null; teks: string | null }[];
  daily_playlists: { date: string }[];
};
type NormalizedProgress = {
  status: string;
  score: number | null;
  updated_at: string;
  evidence_url?: string | null;
  item: { skill_name: string | null; teks: string | null } | null;
  daily: { date: string } | null;
};

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ teks?: string }>;
}) {
  const { teks = "" } = await searchParams;
  const { supabase, profile } = await getUserAndProfile("student");
  const service = createServiceClient();

  const fromDate = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data: rows } = await supabase
    .from("daily_progress")
    .select(
      "status,score,updated_at,evidence_url,daily_playlist_items!inner(skill_name,teks),daily_playlists!inner(date)",
    )
    .eq("student_id", profile.id)
    .gte("daily_playlists.date", fromDate)
    .order("updated_at", { ascending: false });

  const normalized: NormalizedProgress[] = ((rows ?? []) as ProgressRow[]).map((row) => ({
    ...row,
    item: Array.isArray(row.daily_playlist_items) ? row.daily_playlist_items[0] : null,
    daily: Array.isArray(row.daily_playlists) ? row.daily_playlists[0] : null,
  }));

  const filtered = normalized.filter((row) => {
    if (!teks.trim()) return true;
    return String(row.item?.teks ?? "").toLowerCase().includes(teks.toLowerCase());
  });

  const total = filtered.length;
  const complete = filtered.filter((r) => r.status === "submitted" || r.status === "graded").length;
  const today = format(new Date(), "yyyy-MM-dd");
  const momentum = buildWeeklyMomentum(filtered, today);

  const { data: wallet } = await supabase.from("wallets").select("coins").eq("student_id", profile.id).maybeSingle<{ coins: number }>();
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();
  const { data: inventory } = await service
    .from("student_inventory")
    .select("item_key,is_equipped")
    .eq("student_id", profile.id);
  const rewardHistory = getRewardHistorySummary(profile.settings_json);
  const equippedKeys = (inventory ?? []).filter((item) => Boolean(item.is_equipped)).map((item) => item.item_key as string);
  const equippedNames = STORE_ITEMS.filter((item) => equippedKeys.includes(item.key)).map((item) => item.name);

  return (
    <main className="space-y-5">
      <section className="grid gap-3 md:grid-cols-4">
        <div className="panel panel-playful p-4"><div className="math-corner-doodles" aria-hidden="true" /><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Levels Cleared</p><p className="font-display text-3xl font-extrabold">{complete}/{total}</p></div>
        <div className="panel panel-playful p-4"><div className="math-corner-doodles" aria-hidden="true" /><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">XP Bank</p><p className="font-display text-3xl font-extrabold text-amber-300">{xpRow?.xp ?? 0}</p></div>
        <div className="panel panel-playful p-4"><div className="math-corner-doodles" aria-hidden="true" /><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Coins</p><p className="font-display text-3xl font-extrabold text-lime-300">{wallet?.coins ?? 0}</p></div>
        <div className="panel panel-playful p-4"><div className="math-corner-doodles" aria-hidden="true" /><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Streak</p><p className="font-display text-3xl font-extrabold text-pink-300">{momentum.streak}</p></div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.2fr,0.8fr,0.8fr]">
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Mission Coach</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white">
            {momentum.completedCount >= 6 ? "You are on a serious math run" : "Keep your mission streak alive"}
          </h2>
          <p className="mt-2 text-sm text-indigo-100/85">
            {momentum.completedCount >= 6
              ? "You have been clearing a lot of missions this week. Keep submitting show-your-work notes to stay strong on the leaderboard."
              : "A few more completed missions this week will build momentum fast. Try finishing in order and showing your thinking."}
          </p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-mission">Weekly clears: {momentum.completedCount}</span>
            <span className="poster-chip poster-chip-star">Evidence count: {momentum.evidenceCount}</span>
            {momentum.topSkill ? <span className="poster-chip poster-chip-math">Hot TEKS: {momentum.topSkill}</span> : null}
          </div>
        </div>
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Average Score</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-amber-300">{momentum.avgScore ?? "-"}</p>
          <p className="mt-2 text-sm text-indigo-100/85">Teacher-graded score average for the visible missions.</p>
        </div>
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Skill Focus</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-lime-300">{momentum.topSkill ?? "Explore"}</p>
          <p className="mt-2 text-sm text-indigo-100/85">This is the TEKS area you are touching most right now.</p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr,1fr,1fr]">
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Badge Vault</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-amber-300">{rewardHistory.totalBadges}</p>
          <p className="mt-2 text-sm text-indigo-100/85">unique badges earned across your missions</p>
          <div className="poster-chip-row">
            {rewardHistory.badgeIds.slice(0, 3).map((badgeId) => (
              <span key={badgeId} className="poster-chip poster-chip-star">{badgeId.replaceAll("-", " ")}</span>
            ))}
          </div>
        </div>
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Treasure Chests</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-lime-300">{rewardHistory.openedChestCount}</p>
          <p className="mt-2 text-sm text-indigo-100/85">boards fully cleared and opened</p>
        </div>
        <div className="panel panel-playful p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Equipped Collection</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-pink-300">{equippedNames.length ? equippedNames.join(", ") : "Starter Gear"}</p>
          <p className="mt-2 text-sm text-indigo-100/85">your current mission theme loadout</p>
        </div>
      </section>

      <section className="panel panel-playful table-garden p-5">
        <div className="math-corner-doodles" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">Weekly Mission Log</h2>
          <Link className="btn border border-white/20 bg-white/10 text-white" href="/student/today">Back to Today</Link>
        </div>

        <form className="mt-4 flex flex-wrap gap-2">
          <input name="teks" defaultValue={teks} placeholder="Filter by TEKS (example: 4.4A)" className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white md:flex-1" />
          <button className="btn btn-primary">Filter</button>
          <Link className="btn border border-white/20 bg-white/10 text-white" href="/student/dashboard">Reset</Link>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/15 bg-black/20">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-cyan-100">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Skill</th>
                <th className="px-3 py-3">TEKS</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={idx} className="border-t border-white/10 text-indigo-50">
                  <td className="px-3 py-2">{row.daily?.date}</td>
                  <td className="px-3 py-2 font-semibold">{row.item?.skill_name}</td>
                  <td className="px-3 py-2">{row.item?.teks}</td>
                  <td className="px-3 py-2"><span className={`status-pill status-${row.status}`}>{row.status}</span></td>
                  <td className="px-3 py-2">{row.score ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length ? null : (
          <div className="poster-empty-state mt-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Math Notes</p>
            <p className="mt-2 font-display text-xl font-extrabold text-slate-900">No progress rows match that filter.</p>
            <p className="mt-1 text-sm text-slate-700">Try a different TEKS code or reset the filter to see your mission history.</p>
          </div>
        )}
      </section>
    </main>
  );
}

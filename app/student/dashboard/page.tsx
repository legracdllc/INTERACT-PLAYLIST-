import Link from "next/link";
import { subDays, format } from "date-fns";
import { getUserAndProfile } from "@/lib/auth";

type ProgressRow = {
  status: string;
  score: number | null;
  updated_at: string;
  daily_playlist_items: { skill_name: string | null; teks: string | null }[];
  daily_playlists: { date: string }[];
};
type NormalizedProgress = {
  status: string;
  score: number | null;
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

  const fromDate = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data: rows } = await supabase
    .from("daily_progress")
    .select(
      "status,score,updated_at,daily_playlist_items!inner(skill_name,teks),daily_playlists!inner(date)",
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

  const { data: wallet } = await supabase.from("wallets").select("coins").eq("student_id", profile.id).maybeSingle<{ coins: number }>();
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();

  return (
    <main className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Levels Cleared</p><p className="font-display text-3xl font-extrabold">{complete}/{total}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">XP Bank</p><p className="font-display text-3xl font-extrabold text-amber-300">{xpRow?.xp ?? 0}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.15em] text-cyan-200">Coins</p><p className="font-display text-3xl font-extrabold text-lime-300">{wallet?.coins ?? 0}</p></div>
      </section>

      <section className="panel p-5">
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
      </section>
    </main>
  );
}

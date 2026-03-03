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
        <div className="panel p-4"><p className="text-sm text-slate-500">Completed This Week</p><p className="font-display text-3xl font-extrabold">{complete}/{total}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-500">XP</p><p className="font-display text-3xl font-extrabold">{xpRow?.xp ?? 0}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-500">Coins</p><p className="font-display text-3xl font-extrabold">{wallet?.coins ?? 0}</p></div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">Weekly Progress</h2>
        <form className="mt-4 flex gap-2">
          <input name="teks" defaultValue={teks} placeholder="Filter by TEKS (e.g. 4.4A)" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          <button className="btn btn-primary">Apply</button>
          <Link className="btn border border-slate-200 bg-white" href="/student/dashboard">Reset</Link>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Date</th>
                <th className="py-2">Skill</th>
                <th className="py-2">TEKS</th>
                <th className="py-2">Status</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="py-2">{row.daily?.date}</td>
                  <td className="py-2 font-semibold">{row.item?.skill_name}</td>
                  <td className="py-2">{row.item?.teks}</td>
                  <td className="py-2">{row.status}</td>
                  <td className="py-2">{row.score ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

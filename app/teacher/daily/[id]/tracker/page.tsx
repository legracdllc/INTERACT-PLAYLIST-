import Link from "next/link";
import { gradeProgressAction } from "@/app/teacher/actions";
import { getUserAndProfile } from "@/lib/auth";

type DailyHeader = {
  id: string;
  title: string | null;
  date: string;
  class_id: string;
  classes: { name: string | null } | null;
};
type TrackerItem = {
  id: string;
  order_index: number;
  skill_name: string | null;
  teks: string | null;
  max_score: number | null;
};
type RosterRow = {
  student_id: string;
  profiles: { full_name: string | null }[];
};
type ProgressRow = {
  id: string;
  student_id: string;
  daily_playlist_item_id: string;
  status: string;
  score: number | null;
  teacher_note: string | null;
};

export default async function TeacherTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getUserAndProfile("teacher");

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,title,date,class_id,classes(name)")
    .eq("id", id)
    .single<DailyHeader>();

  if (!daily) {
    return <p className="panel p-5">Daily playlist not found.</p>;
  }

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index,skill_name,teks,max_score")
    .eq("daily_playlist_id", id)
    .order("order_index", { ascending: true });

  const { data: roster } = await supabase
    .from("class_students")
    .select("student_id,profiles!inner(id,full_name)")
    .eq("class_id", daily.class_id);

  const { data: progressRows } = await supabase
    .from("daily_progress")
    .select("id,student_id,daily_playlist_item_id,status,score,teacher_note")
    .eq("daily_playlist_id", id);

  const byCell = new Map<string, ProgressRow>();
  for (const row of progressRows ?? []) {
    byCell.set(`${row.student_id}:${row.daily_playlist_item_id}`, row);
  }

  return (
    <main className="space-y-4">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">Tracker Grid</h2>
            <p className="text-sm text-slate-600">{daily.classes?.name} - {daily.date}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/teacher/daily/${id}`} className="btn border border-slate-200 bg-white">Back to Builder</Link>
            <Link href={`/api/teacher/export/${id}`} className="btn btn-primary">Export CSV</Link>
          </div>
        </div>
      </section>

      <section className="panel overflow-x-auto p-4">
        <table className="min-w-full border-separate border-spacing-2 text-sm">
          <thead>
            <tr>
              <th className="rounded-lg bg-slate-100 px-3 py-2 text-left">Student</th>
              {((items ?? []) as TrackerItem[]).map((item, index) => (
                <th key={item.id} className="min-w-52 rounded-lg bg-slate-100 px-3 py-2 text-left align-top">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Item {index + 1}</p>
                  <p>{item.skill_name || "Skill"}</p>
                  <p className="text-xs text-slate-500">TEKS: {item.teks || "-"}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {((roster ?? []) as RosterRow[]).map((student) => (
              <tr key={student.student_id}>
                <td className="rounded-lg bg-slate-50 px-3 py-2 align-top font-semibold">{student.profiles?.[0]?.full_name}</td>
                {((items ?? []) as TrackerItem[]).map((item) => {
                  const progress = byCell.get(`${student.student_id}:${item.id}`);
                  return (
                    <td key={item.id} className="rounded-lg border border-slate-200 bg-white p-2 align-top">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{progress?.status ?? "not_started"}</p>
                      <p className="text-sm">Score: {progress?.score ?? "-"}</p>
                      {progress ? (
                        <form action={gradeProgressAction} className="mt-2 space-y-2">
                          <input type="hidden" name="progressId" value={progress.id} />
                          <input type="hidden" name="dailyId" value={id} />
                          <input
                            name="score"
                            defaultValue={progress.score ?? ""}
                            type="number"
                            step="0.1"
                            max={item.max_score ?? undefined}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                            placeholder="Score"
                          />
                          <input
                            name="teacherNote"
                            defaultValue={progress.teacher_note ?? ""}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                            placeholder="Teacher note"
                          />
                          <button className="btn btn-primary w-full px-2 py-1 text-xs">Save Grade</button>
                        </form>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">No submission yet.</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

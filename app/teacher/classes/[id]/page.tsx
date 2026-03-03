import Link from "next/link";
import { createDailyForClassAction, createStudentAndAssignAction } from "@/app/teacher/actions";
import { getUserAndProfile } from "@/lib/auth";

type RosterRow = {
  student_id: string;
  profiles: { full_name: string | null; email: string | null; settings_json: { student_id?: string } | null }[];
};

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getUserAndProfile("teacher");

  const { data: klass } = await supabase
    .from("classes")
    .select("id,name,teacher_id")
    .eq("id", id)
    .eq("teacher_id", profile.id)
    .single<{ id: string; name: string; teacher_id: string }>();

  if (!klass) {
    return <p className="panel p-5">Class not found.</p>;
  }

  const { data: rosterRows } = await supabase
    .from("class_students")
    .select("student_id, profiles!inner(id,full_name,email,settings_json)")
    .eq("class_id", id);

  const { data: dailies } = await supabase
    .from("daily_playlists")
    .select("id,date,title,published")
    .eq("class_id", id)
    .order("date", { ascending: false });

  return (
    <main className="space-y-6">
      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">{klass.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Create student accounts and assign daily playlists.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <h3 className="font-display text-xl font-bold">Create Student Account + Assign</h3>
          <form action={createStudentAndAssignAction} className="mt-4 space-y-3">
            <input type="hidden" name="classId" value={id} />
            <label className="block">
              <span className="text-sm font-bold">Full Name</span>
              <input name="fullName" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Jordan Smith" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Student ID (A123456)</span>
              <input name="studentId" required pattern="[A-Z][0-9]{6}" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">PIN (6 digits)</span>
              <input name="pin" required pattern="[0-9]{6}" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <button className="btn btn-primary w-full">Create Student</button>
          </form>
        </article>

        <article className="panel p-5">
          <h3 className="font-display text-xl font-bold">Create Daily Playlist By Date</h3>
          <form action={createDailyForClassAction} className="mt-4 space-y-3">
            <input type="hidden" name="classId" value={id} />
            <label className="block">
              <span className="text-sm font-bold">Date</span>
              <input name="date" type="date" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <button className="btn btn-primary w-full">Create / Open Playlist</button>
          </form>

          <h4 className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Existing Dailies</h4>
          <div className="mt-3 space-y-2">
            {(dailies ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold">{d.date} {d.published ? "(Published)" : "(Draft)"}</p>
                <div className="flex gap-2">
                  <Link href={`/teacher/daily/${d.id}`} className="text-sm font-bold text-sky-700">Edit</Link>
                  <Link href={`/teacher/daily/${d.id}/tracker`} className="text-sm font-bold text-emerald-700">Tracker</Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-xl font-bold">Roster</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Student ID</th>
              </tr>
            </thead>
            <tbody>
              {((rosterRows ?? []) as RosterRow[]).map((row) => (
                <tr key={row.student_id} className="border-t border-slate-100">
                  <td className="py-2 font-semibold">{row.profiles?.[0]?.full_name}</td>
                  <td className="py-2">{row.profiles?.[0]?.email}</td>
                  <td className="py-2">{row.profiles?.[0]?.settings_json?.student_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

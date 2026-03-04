import Link from "next/link";
import { createDailyForClassAction, createStudentAndAssignAction, resetStudentPinAction } from "@/app/teacher/actions";
import { getUserAndProfile } from "@/lib/auth";

type RosterRow = {
  student_id: string;
  profiles: { id: string; full_name: string | null; settings_json: { student_id?: string } | null }[];
};

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getUserAndProfile("teacher");
  const [klassResult, rosterResult, dailiesResult] = await Promise.all([
    supabase
      .from("classes")
      .select("id,name,teacher_id")
      .eq("id", id)
      .eq("teacher_id", profile.id)
      .single<{ id: string; name: string; teacher_id: string }>(),
    supabase
      .from("class_students")
      .select("student_id,profiles!inner(id,full_name,settings_json)")
      .eq("class_id", id),
    supabase
      .from("daily_playlists")
      .select("id,date,title,published")
      .eq("class_id", id)
      .order("date", { ascending: false }),
  ]);

  const klass = klassResult.data;

  if (!klass) {
    return <p className="panel p-5">Class not found.</p>;
  }

  const rosterRows = (rosterResult.data ?? []) as RosterRow[];
  const dailies = dailiesResult.data ?? [];

  return (
    <main className="space-y-6">
      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">{klass.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Create student accounts and assign daily playlists.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <h3 className="font-display text-xl font-bold">Create Student Account + Assign</h3>
          <form action={createStudentAndAssignAction} className="mt-4 space-y-3" noValidate>
            <input type="hidden" name="classId" value={id} />
            <label className="block">
              <span className="text-sm font-bold">Full Name</span>
              <input name="fullName" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Jordan Smith" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Student ID (A1234567)</span>
              <input name="studentId" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">PIN (6 digits)</span>
              <input name="pin" required inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
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
            {dailies?.length ? null : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No daily playlists yet. Use the date picker above to create the first one.
              </p>
            )}
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
                <th className="py-2">Student ID</th>
                <th className="py-2">PIN</th>
              </tr>
            </thead>
            <tbody>
              {rosterRows.map((row) => {
                const profileRow = row.profiles?.[0];
                return (
                  <tr key={row.student_id} className="border-t border-slate-100">
                    <td className="py-2 font-semibold">{profileRow?.full_name ?? "Student"}</td>
                    <td className="py-2">{profileRow?.settings_json?.student_id ?? "-"}</td>
                    <td className="py-2">
                      <form action={resetStudentPinAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="classId" value={id} />
                        <input type="hidden" name="studentProfileId" value={row.student_id as string} />
                        <input
                          name="pin"
                          required
                          pattern="[0-9]{6}"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="******"
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <button className="btn border border-slate-200 bg-white px-3 py-1 text-sm">Update PIN</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rosterRows.length ? null : (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No students in this roster yet. Create a student above to get started.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

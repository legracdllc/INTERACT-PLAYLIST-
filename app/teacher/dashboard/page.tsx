import Link from "next/link";
import { format } from "date-fns";
import { getUserAndProfile } from "@/lib/auth";
import { createDailyForClassAction } from "@/app/teacher/actions";

export default async function TeacherDashboardPage() {
  const { supabase, profile } = await getUserAndProfile("teacher");

  const { data: classes } = await supabase
    .from("classes")
    .select("id,name,created_at")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <main className="space-y-6">
      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">Classes Overview</h2>
        <p className="mt-1 text-sm text-slate-600">Create today&apos;s playlist fast and jump into tracker view.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(classes ?? []).map((klass) => (
          <article key={klass.id} className="panel p-5">
            <h3 className="font-display text-xl font-bold">{klass.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Class ID: {klass.id}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn border border-slate-200 bg-white" href={`/teacher/classes/${klass.id}`}>Open Roster</Link>
              <form action={createDailyForClassAction}>
                <input type="hidden" name="classId" value={klass.id} />
                <input type="hidden" name="date" value={today} />
                <button className="btn btn-primary">Today&apos;s Playlist</button>
              </form>
            </div>
          </article>
        ))}
      </section>

      {classes?.length ? null : (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          No classes yet. Create your first class in <Link className="font-bold underline" href="/teacher/classes">Classes</Link>.
        </p>
      )}
    </main>
  );
}

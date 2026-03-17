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
      <section className="poster-hero">
        <div className="relative z-10">
          <p className="poster-ribbon">Poster Mission Board</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-900">Classes Overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Build playful math missions, open class rosters fast, and keep each poster world moving with today&apos;s playlist.</p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-mission">Today: {today}</span>
            <span className="poster-chip poster-chip-math">{classes?.length ?? 0} active classes</span>
          </div>
        </div>
      </section>

      <section className="poster-stat-grid md:grid-cols-3">
        <article className="poster-stat">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Poster Worlds</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{classes?.length ?? 0}</p>
          <p className="mt-1 text-sm text-slate-500">Classrooms ready for math adventures.</p>
        </article>
        <article className="poster-stat">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Today&apos;s Goal</p>
          <p className="mt-2 text-lg font-black text-slate-900">Open a roster and launch one playlist.</p>
        </article>
        <article className="poster-stat">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Poster Theme</p>
          <p className="mt-2 text-lg font-black text-slate-900">Fractions, graphs, geometry, time.</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(classes ?? []).map((klass) => (
          <article key={klass.id} className="panel panel-playful p-5">
            <div className="math-corner-doodles" aria-hidden="true" />
            <h3 className="font-display text-xl font-bold">{klass.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Class ID: {klass.id}</p>
            <div className="poster-chip-row">
              <span className="poster-chip poster-chip-mission">Roster Ready</span>
              <span className="poster-chip poster-chip-star">Playlist Boost</span>
            </div>
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
        <section className="poster-empty-state">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Empty Poster Wall</p>
          <p className="mt-2 font-display text-xl font-black text-slate-900">No classes yet.</p>
          <p className="mt-1 text-sm text-slate-600">Create your first classroom to unlock the roster board, tracker grid, and math mission posters.</p>
          <p className="mt-3 text-sm font-bold text-sky-700"><Link href="/teacher/classes">Go to Classes</Link></p>
        </section>
      )}
    </main>
  );
}

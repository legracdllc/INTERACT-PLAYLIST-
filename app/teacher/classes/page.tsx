import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { createClassAction } from "@/app/teacher/actions";

export default async function TeacherClassesPage() {
  const { supabase, profile } = await getUserAndProfile("teacher");

  const { data: classes } = await supabase
    .from("classes")
    .select("id,name,created_at")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="space-y-6">
      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">Create Class</h2>
        <form action={createClassAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block min-w-56 flex-1">
            <span className="text-sm font-bold">Class Name</span>
            <input name="name" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="4th Grade Math - Homeroom A" />
          </label>
          <button className="btn btn-primary">Create Class</button>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-2xl font-bold">Your Classes</h2>
        <div className="mt-4 space-y-2">
          {(classes ?? []).map((klass) => (
            <Link key={klass.id} href={`/teacher/classes/${klass.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-sky-300">
              <span className="font-bold">{klass.name}</span>
              <span className="text-sm text-slate-500">Open</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

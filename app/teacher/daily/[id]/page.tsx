import Link from "next/link";
import { addDailyItemAction, moveDailyItemAction, togglePublishAction, updateDailyMetaAction } from "@/app/teacher/actions";
import { getUserAndProfile } from "@/lib/auth";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";

const itemTypes = ["mini", "guided", "independent", "staar", "challenge", "exit"];
const mToolOptions = [
  "PVC (Place Value Chart)",
  "120 Chart",
  "AM (Area Model)",
  "UPSC (Understand, Plan, Solve, Check)",
  "PSF Chart (Problem Solve Flow Chart)",
];
const materialOptions = ["Strategy sheet", "Dry eraser markers", "Pencil", "Laptop"];

type DailyHeader = {
  id: string;
  class_id: string;
  date: string;
  title: string | null;
  instructions: string | null;
  student_objective: string | null;
  teks: string | null;
  m_tools: string[] | null;
  materials: string[] | null;
  published: boolean;
  classes: { name: string | null } | null;
};
type DailyItem = {
  id: string;
  order_index: number;
  teks: string | null;
  skill_name: string | null;
  type: string | null;
  url: string | null;
  xp: number;
  max_score: number | null;
};

export default async function TeacherDailyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { supabase } = await getUserAndProfile("teacher");

  const [dailyResult, itemsResult] = await Promise.all([
    supabase
      .from("daily_playlists")
      .select("id,class_id,date,title,instructions,student_objective,teks,m_tools,materials,published,classes(name)")
      .eq("id", id)
      .single<DailyHeader>(),
    supabase
      .from("daily_playlist_items")
      .select("id,order_index,teks,skill_name,type,url,xp,max_score")
      .eq("daily_playlist_id", id)
      .order("order_index", { ascending: true }),
  ]);

  const daily = dailyResult.data;

  if (!daily) {
    return <p className="panel p-5">Daily playlist not found.</p>;
  }

  const items = itemsResult.data ?? [];

  return (
    <main className="space-y-6">
      <section className="panel p-5">
        {saved === "header" ? (
          <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Header saved successfully.
          </p>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">Edit Daily Playlist</h2>
            <p className="text-sm text-slate-600">{daily.classes?.name} - {daily.date}</p>
          </div>
          <div className="flex gap-2">
            <Link className="btn border border-slate-200 bg-white" href={`/teacher/daily/${id}/tracker`}>Open Tracker</Link>
            <form action={togglePublishAction}>
              <input type="hidden" name="dailyId" value={id} />
              <input type="hidden" name="published" value={daily.published ? "false" : "true"} />
              <button className="btn btn-primary">{daily.published ? "Unpublish" : "Publish"}</button>
            </form>
          </div>
        </div>

        <form action={updateDailyMetaAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="dailyId" value={id} />
          <label className="block">
            <span className="text-sm font-bold">Title</span>
            <input name="title" defaultValue={daily.title ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">TEKS</span>
            <input name="teks" defaultValue={daily.teks ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="4.4A, 4.5B" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Student Objective</span>
            <input
              name="studentObjective"
              defaultValue={daily.student_objective ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              placeholder="I can solve equivalent fraction problems."
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Instructions</span>
            <input
              name="instructions"
              defaultValue={daily.instructions ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Complete all levels in order and submit evidence."
            />
          </label>
          <MultiSelectDropdown
            name="mTools"
            label="M-Tools"
            options={mToolOptions}
            initialSelected={daily.m_tools ?? []}
            placeholder="Select M-Tools"
          />
          <MultiSelectDropdown
            name="materials"
            label="Materials"
            options={materialOptions}
            initialSelected={daily.materials ?? []}
            placeholder="Select Materials"
          />
          <button className="btn btn-primary md:col-span-2">Save Header</button>
        </form>
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-xl font-bold">Add Item</h3>
        <form action={addDailyItemAction} className="mt-4 grid gap-3 md:grid-cols-6">
          <input type="hidden" name="dailyId" value={id} />
          <input name="skill" required placeholder="Skill Name" className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
          <input name="teks" placeholder="TEKS (e.g. 4.4A)" className="rounded-xl border border-slate-200 px-3 py-2" />
          <select name="type" className="rounded-xl border border-slate-200 px-3 py-2">
            {itemTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input name="url" placeholder="Resource URL" className="rounded-xl border border-slate-200 px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input name="xp" type="number" min={0} defaultValue={10} className="rounded-xl border border-slate-200 px-3 py-2" />
            <input name="maxScore" type="number" step="0.1" min={0} placeholder="Max" className="rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <button className="btn btn-primary md:col-span-6">Add Item</button>
        </form>
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-xl font-bold">Playlist Items</h3>
        <div className="mt-4 space-y-2">
          {((items ?? []) as DailyItem[]).map((item, index) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">#{index + 1} - {item.type}</p>
                  <p className="font-bold">{item.skill_name || "Untitled Skill"}</p>
                  <p className="text-sm text-slate-600">TEKS: {item.teks || "-"} | XP: {item.xp}</p>
                </div>
                <div className="flex gap-1">
                  <form action={moveDailyItemAction}>
                    <input type="hidden" name="dailyId" value={id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="btn border border-slate-200 bg-white px-3 py-1 text-sm">Up</button>
                  </form>
                  <form action={moveDailyItemAction}>
                    <input type="hidden" name="dailyId" value={id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="btn border border-slate-200 bg-white px-3 py-1 text-sm">Down</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
        {items?.length ? null : (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add your first playlist item above to unlock student progress tracking and grading.
          </p>
        )}
      </section>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-bold">Student Preview</h3>
          <p className="text-sm text-slate-500">How students will see this daily playlist</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
          <div className="rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">Today&apos;s Mission</p>
            <h4 className="mt-1 font-display text-2xl font-extrabold">{daily.title || "Daily Playlist"}</h4>
            {daily.teks ? <p className="mt-1 text-sm text-cyan-100">TEKS: {daily.teks}</p> : null}
            {daily.student_objective ? <p className="mt-1 text-sm text-amber-100">Objective: {daily.student_objective}</p> : null}
            {daily.instructions ? <p className="mt-1 text-sm text-slate-200/90">{daily.instructions}</p> : null}
            {daily.m_tools?.length ? <p className="mt-1 text-sm text-lime-100">M-Tools: {daily.m_tools.join(", ")}</p> : null}
            {daily.materials?.length ? <p className="mt-1 text-sm text-pink-100">Materials: {daily.materials.join(", ")}</p> : null}
            <div className="mt-3 h-3 rounded-full bg-slate-800">
              <div className="h-3 w-0 rounded-full bg-gradient-to-r from-lime-300 to-cyan-300" />
            </div>
            <p className="mt-2 text-xs text-slate-300">0 / {(items ?? []).length} levels completed</p>
          </div>

          <div className="mt-4 space-y-3">
            {((items ?? []) as DailyItem[]).map((item, index) => (
              <article key={item.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">World {index + 1} - {item.type ?? "activity"}</p>
                    <p className="font-bold text-white">{item.skill_name || "Untitled Skill"}</p>
                    <p className="text-sm text-slate-300">TEKS: {item.teks || "-"} | XP: {item.xp}</p>
                  </div>
                  <span className="rounded-full border border-slate-600 px-2 py-1 text-xs font-bold text-slate-200">not_started</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-white">Start Quest</button>
                  <button type="button" className="btn border border-cyan-400 bg-cyan-500/90 px-3 py-1 text-xs text-slate-900">Submit Score</button>
                </div>
              </article>
            ))}
            {items?.length ? null : (
              <p className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
                Add at least one item to preview the student view.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

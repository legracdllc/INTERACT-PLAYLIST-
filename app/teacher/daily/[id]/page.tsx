import Link from "next/link";
import { addDailyItemAction, moveDailyItemAction, togglePublishAction, updateDailyMetaAction } from "@/app/teacher/actions";
import { getUserAndProfile } from "@/lib/auth";

const itemTypes = ["mini", "guided", "independent", "staar", "challenge", "exit"];
type DailyHeader = {
  id: string;
  class_id: string;
  date: string;
  title: string | null;
  notes: string | null;
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

export default async function TeacherDailyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getUserAndProfile("teacher");

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,class_id,date,title,notes,published,classes(name)")
    .eq("id", id)
    .single<DailyHeader>();

  if (!daily) {
    return <p className="panel p-5">Daily playlist not found.</p>;
  }

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index,teks,skill_name,type,url,xp,max_score")
    .eq("daily_playlist_id", id)
    .order("order_index", { ascending: true });

  return (
    <main className="space-y-6">
      <section className="panel p-5">
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
            <span className="text-sm font-bold">Notes</span>
            <input name="notes" defaultValue={daily.notes ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
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
      </section>
    </main>
  );
}

import { getUserAndProfile } from "@/lib/auth";
import { StudentDailyClient } from "@/components/student-daily-client";

type DailyRow = {
  id: string;
  class_id: string;
  title: string | null;
  instructions: string | null;
  student_objective: string | null;
  teks: string | null;
  m_tools: string[] | null;
  materials: string[] | null;
  published: boolean;
  date: string;
};

export default async function StudentDailyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getUserAndProfile("student");

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,class_id,title,instructions,student_objective,teks,m_tools,materials,published,date")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle<DailyRow>();

  if (!daily) {
    return <p className="panel p-5">Playlist not found or not published.</p>;
  }

  const { data: allowed } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("class_id", daily.class_id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!allowed) {
    return <p className="panel p-5">You do not have access to this playlist.</p>;
  }

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index,skill_name,teks,type,url,xp,max_score")
    .eq("daily_playlist_id", id)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("id,daily_playlist_item_id,status,score,evidence_url")
    .eq("daily_playlist_id", id)
    .eq("student_id", profile.id);

  return (
    <main className="space-y-4">
      <section className="panel game-shell p-5">
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-extrabold text-white">{daily.title || "Daily Playlist"}</h2>
          <p className="mt-1 text-sm text-cyan-100">Date: {daily.date}</p>
          {daily.teks ? <p className="mt-2 text-sm text-cyan-100">TEKS: {daily.teks}</p> : null}
          {daily.student_objective ? <p className="mt-1 text-sm text-amber-100">Objective: {daily.student_objective}</p> : null}
          {daily.instructions ? <p className="mt-1 text-indigo-100/90">{daily.instructions}</p> : null}
          {daily.m_tools?.length ? <p className="mt-1 text-sm text-lime-100">M-Tools: {daily.m_tools.join(", ")}</p> : null}
          {daily.materials?.length ? <p className="mt-1 text-sm text-pink-100">Materials: {daily.materials.join(", ")}</p> : null}
        </div>
      </section>
      <StudentDailyClient dailyId={id} items={items ?? []} progressRows={progress ?? []} />
    </main>
  );
}

import Link from "next/link";
import { format } from "date-fns";
import { getUserAndProfile } from "@/lib/auth";
import { StudentDailyClient } from "@/components/student-daily-client";

type DailyRow = {
  id: string;
  title: string | null;
  instructions: string | null;
  student_objective: string | null;
  teks: string | null;
  m_tools: string[] | null;
  materials: string[] | null;
  date: string;
  published: boolean;
};

export default async function StudentTodayPage() {
  const { supabase, profile } = await getUserAndProfile("student");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: memberships } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", profile.id);

  const classId = memberships?.[0]?.class_id;
  if (!classId) {
    return <p className="panel p-5">You are not assigned to a class yet.</p>;
  }

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,title,instructions,student_objective,teks,m_tools,materials,date,published")
    .eq("class_id", classId)
    .eq("date", today)
    .eq("published", true)
    .maybeSingle<DailyRow>();

  if (!daily) {
    return <p className="panel p-5">No published playlist for today ({today}) yet.</p>;
  }

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index,skill_name,teks,type,url,xp,max_score")
    .eq("daily_playlist_id", daily.id)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("id,daily_playlist_item_id,status,score,evidence_url")
    .eq("daily_playlist_id", daily.id)
    .eq("student_id", profile.id);

  return (
    <main className="space-y-4">
      <section className="panel game-shell spark p-5 md:p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Today&apos;s Mission</p>
            <h2 className="font-display text-3xl font-extrabold text-white md:text-4xl">{daily.title || "Daily Playlist"}</h2>
            <p className="mt-1 text-sm text-indigo-100/85">Pilot: {profile.full_name}</p>
            {daily.teks ? <p className="mt-2 text-sm text-cyan-100">TEKS: {daily.teks}</p> : null}
            {daily.student_objective ? <p className="mt-1 text-sm text-amber-100">Objective: {daily.student_objective}</p> : null}
            {daily.instructions ? <p className="mt-1 max-w-3xl text-indigo-100/95">{daily.instructions}</p> : null}
            {daily.m_tools?.length ? <p className="mt-1 max-w-3xl text-sm text-lime-100">M-Tools: {daily.m_tools.join(", ")}</p> : null}
            {daily.materials?.length ? <p className="mt-1 max-w-3xl text-sm text-pink-100">Materials: {daily.materials.join(", ")}</p> : null}
          </div>
          <Link href={`/student/daily/${daily.id}`} className="btn border border-white/20 bg-white/10 text-white">Open Full Board</Link>
        </div>
      </section>
      <StudentDailyClient dailyId={daily.id} items={items ?? []} progressRows={progress ?? []} />
    </main>
  );
}

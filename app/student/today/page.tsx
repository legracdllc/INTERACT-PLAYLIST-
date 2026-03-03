import Link from "next/link";
import { format } from "date-fns";
import { getUserAndProfile } from "@/lib/auth";
import { StudentDailyClient } from "@/components/student-daily-client";

type DailyRow = {
  id: string;
  title: string | null;
  notes: string | null;
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
    .select("id,title,notes,date,published")
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
      <section className="panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Today&apos;s Mission</p>
        <h2 className="font-display text-3xl font-extrabold">{daily.title || "Daily Playlist"}</h2>
        {daily.notes ? <p className="mt-2 text-slate-600">{daily.notes}</p> : null}
        <Link href={`/student/daily/${daily.id}`} className="mt-4 inline-block text-sm font-bold text-sky-700 underline">Open Full Page</Link>
      </section>
      <StudentDailyClient dailyId={daily.id} items={items ?? []} progressRows={progress ?? []} />
    </main>
  );
}

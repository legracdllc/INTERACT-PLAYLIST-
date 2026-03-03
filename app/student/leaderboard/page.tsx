import { getUserAndProfile } from "@/lib/auth";

type LeaderboardRow = {
  student_id: string;
  profiles: { full_name: string | null }[];
  progress_xp: { xp: number }[];
};

export default async function StudentLeaderboardPage() {
  const { supabase, profile } = await getUserAndProfile("student");

  const { data: membership } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", profile.id)
    .limit(1)
    .maybeSingle<{ class_id: string }>();

  if (!membership) {
    return <p className="panel p-5">No class assigned.</p>;
  }

  const { data: classmates } = await supabase
    .from("class_students")
    .select("student_id,profiles!inner(full_name),progress_xp(xp)")
    .eq("class_id", membership.class_id);

  const sorted = [...((classmates ?? []) as LeaderboardRow[])].sort(
    (a, b) => (b.progress_xp?.[0]?.xp ?? 0) - (a.progress_xp?.[0]?.xp ?? 0),
  );

  return (
    <main className="panel p-5">
      <h2 className="font-display text-2xl font-bold">Class Leaderboard</h2>
      <ol className="mt-4 space-y-2">
        {sorted.map((row, idx) => {
          const name = row.profiles?.[0]?.full_name || "Student";
          const parts = name.split(" ");
          const shown = `${parts[0]} ${parts.length > 1 ? `${parts[parts.length - 1].charAt(0)}.` : ""}`;
          return (
            <li key={row.student_id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="font-semibold">#{idx + 1} {shown}</span>
              <span className="text-sm text-slate-600">XP: {row.progress_xp?.[0]?.xp ?? 0}</span>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

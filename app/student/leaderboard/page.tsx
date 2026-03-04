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
    <main className="panel game-shell spark p-5">
      <div className="relative z-10">
        <h2 className="font-display text-2xl font-bold">Class Leaderboard</h2>
        <p className="mt-1 text-sm text-indigo-100/85">Top XP pilots in your class this week.</p>
      </div>
      <ol className="relative z-10 mt-4 space-y-2">
        {sorted.map((row, idx) => {
          const name = row.profiles?.[0]?.full_name || "Student";
          const parts = name.split(" ");
          const shown = `${parts[0]} ${parts.length > 1 ? `${parts[parts.length - 1].charAt(0)}.` : ""}`;
          return (
            <li key={row.student_id} className="flex items-center justify-between rounded-xl border border-white/20 bg-black/20 px-3 py-3">
              <span className="font-semibold text-white">#{idx + 1} {shown}</span>
              <span className="text-sm font-bold text-amber-300">XP {row.progress_xp?.[0]?.xp ?? 0}</span>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

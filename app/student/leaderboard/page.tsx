import { getStudentClassIdsRobust, getUserAndProfile } from "@/lib/auth";
import { StudentAvatarRenderer } from "@/components/student-avatar-renderer";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeAvatar } from "@/lib/avatar";

type LeaderboardRow = {
  student_id: string;
  name: string;
  avatar: ReturnType<typeof normalizeAvatar>;
  xp: number;
};

export default async function StudentLeaderboardPage() {
  const { profile } = await getUserAndProfile("student");
  const service = createServiceClient();

  const classIds = await getStudentClassIdsRobust(profile.id);
  const classId = classIds[0];

  if (!classId) {
    return (
      <main className="poster-empty-state">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Leaderboard Locked</p>
        <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">No class assigned.</p>
        <p className="mt-1 text-sm text-slate-700">Once a teacher adds you to a class, your XP race will appear here.</p>
      </main>
    );
  }

  const { data: classmates } = await service
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId);

  const studentIds = (classmates ?? []).map((row) => row.student_id as string);
  const [{ data: profiles }, { data: xpRows }] = await Promise.all([
    studentIds.length ? service.from("profiles").select("id,full_name,avatar_json").in("id", studentIds) : { data: [] as never[] },
    studentIds.length ? service.from("progress_xp").select("student_id,xp").in("student_id", studentIds) : { data: [] as never[] },
  ]);
  const profileById = new Map((profiles ?? []).map((row) => [row.id as string, row]));
  const xpById = new Map((xpRows ?? []).map((row) => [row.student_id as string, Number(row.xp ?? 0)]));

  const sorted: LeaderboardRow[] = studentIds.map((studentId) => {
    const entry = profileById.get(studentId);
    return {
      student_id: studentId,
      name: entry?.full_name || "Student",
      avatar: normalizeAvatar(entry?.avatar_json),
      xp: xpById.get(studentId) ?? 0,
    };
  }).sort((a, b) => b.xp - a.xp);

  return (
    <main className="space-y-4">
      <section className="panel game-shell spark panel-playful p-5 md:p-6">
        <div className="math-corner-doodles" aria-hidden="true" />
        <div className="relative z-10">
          <p className="poster-ribbon">XP Race</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">Class Leaderboard</h2>
          <p className="mt-1 text-sm text-indigo-100/85">Top XP pilots in your class this week. The podium should feel like a game board, not a plain spreadsheet.</p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-star">{sorted.length} racers</span>
            <span className="poster-chip poster-chip-math">Poster points</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {sorted.slice(0, 3).map((row, idx) => (
          <article key={row.student_id} className={`leaderboard-podium-card leaderboard-podium-${idx + 1}`}>
            <p className="leaderboard-podium-rank">#{idx + 1}</p>
            <div className="mt-2 flex justify-center">
              <StudentAvatarRenderer avatar={row.avatar} size="md" xp={row.xp} />
            </div>
            <p className="mt-2 font-display text-lg font-extrabold text-white">{row.name}</p>
            <p className="text-sm font-bold text-amber-300">XP {row.xp}</p>
          </article>
        ))}
      </section>

      <section className="panel panel-playful p-5">
        <ol className="space-y-2">
          {sorted.map((row, idx) => {
            const parts = row.name.split(" ");
            const shown = `${parts[0]} ${parts.length > 1 ? `${parts[parts.length - 1].charAt(0)}.` : ""}`;
            return (
              <li key={row.student_id} className="leaderboard-row">
                <div className="flex items-center gap-3">
                  <StudentAvatarRenderer avatar={row.avatar} size="sm" xp={row.xp} />
                  <div>
                    <p className="font-semibold text-white">#{idx + 1} {shown}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">Poster pilot</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-300">XP {row.xp}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

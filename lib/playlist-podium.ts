import { createServiceClient } from "@/lib/supabase/service";
import { normalizeAvatar } from "@/lib/avatar";

type PodiumProfile = {
  id: string;
  full_name: string | null;
  avatar_json: unknown;
};

type PodiumProgress = {
  student_id: string;
  status: string;
  score: number | null;
  evidence_url: string | null;
  submitted_at: string | null;
  graded_at: string | null;
};

export type PlaylistWinner = {
  rank: number;
  studentId: string;
  name: string;
  avatar: ReturnType<typeof normalizeAvatar>;
  completedItems: number;
  evidenceCount: number;
  totalScore: number;
  finishTimeLabel: string;
};

type RankedWinner = Omit<PlaylistWinner, "finishTimeLabel"> & {
  finishAt: string | null;
};

function formatFinishTime(value: string | null) {
  if (!value) {
    return "In progress";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "In progress"
    : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

async function computePlaylistWinners(dailyId: string, classId: string) {
  const service = createServiceClient();
  const [{ data: items }, { data: roster }, { data: progressRows }] = await Promise.all([
    service
      .from("daily_playlist_items")
      .select("id")
      .eq("daily_playlist_id", dailyId),
    service
      .from("class_students")
      .select("student_id")
      .eq("class_id", classId),
    service
      .from("daily_progress")
      .select("student_id,status,score,evidence_url,submitted_at,graded_at")
      .eq("daily_playlist_id", dailyId),
  ]);

  const itemCount = items?.length ?? 0;
  if (!itemCount || !(roster?.length)) {
    return [] as RankedWinner[];
  }

  const studentIds = roster.map((row) => row.student_id as string);
  const { data: profiles } = await service
    .from("profiles")
    .select("id,full_name,avatar_json")
    .in("id", studentIds);

  const profileById = new Map((profiles ?? []).map((row) => [row.id as string, row as PodiumProfile]));
  const progressByStudent = new Map<string, PodiumProgress[]>();

  for (const row of (progressRows ?? []) as PodiumProgress[]) {
    const list = progressByStudent.get(row.student_id) ?? [];
    list.push(row);
    progressByStudent.set(row.student_id, list);
  }

  const ranked = studentIds.map((studentId) => {
    const rows = progressByStudent.get(studentId) ?? [];
    const completedRows = rows.filter((row) => row.status === "submitted" || row.status === "graded");
    const completedItems = completedRows.length;
    const evidenceCount = completedRows.filter((row) => Boolean(row.evidence_url)).length;
    const totalScore = completedRows.reduce((sum, row) => sum + (row.score ?? 0), 0);
    const finishAt = completedItems === itemCount
      ? completedRows
        .map((row) => row.graded_at ?? row.submitted_at)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null
      : null;

    const profile = profileById.get(studentId);
    return {
      studentId,
      name: profile?.full_name?.trim() || "Student",
      avatar: normalizeAvatar(profile?.avatar_json),
      completedItems,
      evidenceCount,
      totalScore,
      finishAt,
    };
  }).filter((entry) => entry.completedItems > 0);

  ranked.sort((a, b) => {
    if (b.completedItems !== a.completedItems) return b.completedItems - a.completedItems;
    if (b.evidenceCount !== a.evidenceCount) return b.evidenceCount - a.evidenceCount;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.finishAt && b.finishAt) return a.finishAt.localeCompare(b.finishAt);
    if (a.finishAt) return -1;
    if (b.finishAt) return 1;
    return a.name.localeCompare(b.name);
  });

  return ranked.slice(0, 3).map((entry, index) => ({
    rank: index + 1,
    studentId: entry.studentId,
    name: entry.name,
    avatar: entry.avatar,
    completedItems: entry.completedItems,
    evidenceCount: entry.evidenceCount,
    totalScore: entry.totalScore,
    finishAt: entry.finishAt,
  }));
}

export async function syncPlaylistWinners(dailyId: string, classId: string) {
  const service = createServiceClient();
  const ranked = await computePlaylistWinners(dailyId, classId);

  const payload = ranked.map((winner) => ({
    daily_playlist_id: dailyId,
    rank: winner.rank,
    student_id: winner.studentId,
    completed_items: winner.completedItems,
    evidence_count: winner.evidenceCount,
    total_score: winner.totalScore,
    finish_time: winner.finishAt,
    award_reason: "completion_score_show_work",
  }));

  try {
    await service.from("daily_playlist_winners").delete().eq("daily_playlist_id", dailyId);
    if (payload.length) {
      await service.from("daily_playlist_winners").insert(payload);
    }
  } catch {
    // Ignore if the new migration has not been applied yet.
  }

  return ranked;
}

export async function getPlaylistWinners(dailyId: string, classId: string) {
  const service = createServiceClient();

  try {
    const { data: stored } = await service
      .from("daily_playlist_winners")
      .select("rank,student_id,completed_items,evidence_count,total_score,finish_time,profiles(full_name,avatar_json)")
      .eq("daily_playlist_id", dailyId)
      .order("rank", { ascending: true });

    if (stored?.length) {
      return stored.map((winner) => {
        const profile = Array.isArray(winner.profiles) ? winner.profiles[0] : winner.profiles;
        return {
          rank: winner.rank as number,
          studentId: winner.student_id as string,
          name: profile?.full_name?.trim() || "Student",
          avatar: normalizeAvatar(profile?.avatar_json),
          completedItems: Number(winner.completed_items ?? 0),
          evidenceCount: Number(winner.evidence_count ?? 0),
          totalScore: Number(winner.total_score ?? 0),
          finishTimeLabel: formatFinishTime((winner.finish_time as string | null) ?? null),
        };
      });
    }
  } catch {
    // Ignore if the new migration has not been applied yet.
  }

  const ranked = await computePlaylistWinners(dailyId, classId);
  return ranked.map((winner) => ({
    rank: winner.rank,
    studentId: winner.studentId,
    name: winner.name,
    avatar: winner.avatar,
    completedItems: winner.completedItems,
    evidenceCount: winner.evidenceCount,
    totalScore: winner.totalScore,
    finishTimeLabel: formatFinishTime(winner.finishAt),
  }));
}

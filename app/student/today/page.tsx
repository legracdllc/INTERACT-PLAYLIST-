import Link from "next/link";
import { format } from "date-fns";
import { getStudentClassIdsRobust, getUserAndProfile } from "@/lib/auth";
import { StudentDailyClient } from "@/components/student-daily-client";
import { getPlaylistWinners } from "@/lib/playlist-podium";
import { PlaylistPodium } from "@/components/playlist-podium";
import { getPersistedRewardState } from "@/lib/student-reward-state";
import { createServiceClient } from "@/lib/supabase/service";
import { getMissionTheme } from "@/lib/mission-theme";

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
  const service = createServiceClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const classIds = await getStudentClassIdsRobust(profile.id);
  const classId = classIds[0];
  if (!classId) {
    return (
      <main className="poster-empty-state">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Mission Not Ready</p>
        <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">You are not assigned to a class yet.</p>
        <p className="mt-1 text-sm text-slate-700">A teacher needs to place you into a poster world before today&apos;s math quest appears.</p>
      </main>
    );
  }

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,title,instructions,student_objective,teks,m_tools,materials,date,published")
    .eq("class_id", classId)
    .eq("date", today)
    .eq("published", true)
    .maybeSingle<DailyRow>();

  if (!daily) {
    return (
      <main className="poster-empty-state">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Quest Loading</p>
        <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">No published playlist for today ({today}) yet.</p>
        <p className="mt-1 text-sm text-slate-700">Your teacher has not opened today&apos;s poster mission board yet.</p>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index,skill_name,teks,type,url,xp,max_score")
    .eq("daily_playlist_id", daily.id)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("id,daily_playlist_item_id,status,score,evidence_url,submitted_at")
    .eq("daily_playlist_id", daily.id)
    .eq("student_id", profile.id);
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();
  const { data: wallet } = await supabase.from("wallets").select("coins").eq("student_id", profile.id).maybeSingle<{ coins: number }>();
  const winners = await getPlaylistWinners(daily.id, classId);
  const rewardState = getPersistedRewardState(profile.settings_json, daily.id);
  const { data: equippedInventory } = await service
    .from("student_inventory")
    .select("item_key,is_equipped")
    .eq("student_id", profile.id)
    .eq("is_equipped", true);
  const missionTheme = getMissionTheme(
    (equippedInventory ?? [])
      .filter((item) => Boolean(item.is_equipped))
      .map((item) => item.item_key as string),
  );

  return (
    <main className="space-y-4">
      <section className="panel game-shell spark panel-playful mission-hero p-5 md:p-6">
        <div className="math-corner-doodles" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="poster-ribbon">Today&apos;s Mission</p>
            <h2 className="font-display text-3xl font-extrabold text-white md:text-4xl">{daily.title || "Daily Playlist"}</h2>
            <p className="mt-1 text-sm text-indigo-100/85">Pilot: {profile.full_name}</p>
            {daily.teks ? <p className="mt-2 text-sm text-cyan-100">TEKS: {daily.teks}</p> : null}
            {daily.student_objective ? <p className="mt-1 text-sm text-amber-100">Objective: {daily.student_objective}</p> : null}
            {daily.instructions ? <p className="mt-1 max-w-3xl text-indigo-100/95">{daily.instructions}</p> : null}
            {daily.m_tools?.length ? <p className="mt-1 max-w-3xl text-sm text-lime-100">M-Tools: {daily.m_tools.join(", ")}</p> : null}
            {daily.materials?.length ? <p className="mt-1 max-w-3xl text-sm text-pink-100">Materials: {daily.materials.join(", ")}</p> : null}
            <div className="poster-chip-row">
              <span className="poster-chip poster-chip-math">{(items ?? []).length} poster worlds</span>
              <span className="poster-chip poster-chip-star">Math power unlocked</span>
            </div>
          </div>
          <Link href={`/student/daily/${daily.id}`} className="btn border border-white/20 bg-white/10 text-white">Open Full Mission Map</Link>
        </div>
      </section>
      <StudentDailyClient
        dailyId={daily.id}
        items={items ?? []}
        progressRows={progress ?? []}
        avatar={profile.avatar_json}
        xp={xpRow?.xp ?? 0}
        coins={wallet?.coins ?? 0}
        today={today}
        initialEarnedBadgeIds={rewardState.earnedBadgeIds}
        initialChestOpened={rewardState.chestOpened}
        missionTheme={missionTheme}
      />
      <PlaylistPodium winners={winners} title="Top 3 Winners For This Playlist" />
    </main>
  );
}

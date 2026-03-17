import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncPlaylistWinners } from "@/lib/playlist-podium";
import { buildMissionBadges, computePlaylistCombo } from "@/lib/student-engagement";
import { mergePersistedRewardState } from "@/lib/student-reward-state";

const schema = z.object({
  dailyId: z.string().uuid(),
  itemId: z.string().uuid(),
  status: z.enum(["in_progress", "submitted"]),
  evidenceUrl: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,settings_json")
    .eq("id", user.id)
    .single<{ role: string; settings_json: Record<string, unknown> | null }>();
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: daily } = await supabase
    .from("daily_playlists")
    .select("id,class_id,published")
    .eq("id", parsed.data.dailyId)
    .eq("published", true)
    .maybeSingle<{ id: string; class_id: string; published: boolean }>();

  if (!daily) {
    return NextResponse.json({ error: "Playlist not available" }, { status: 403 });
  }

  const { data: membership } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("class_id", daily.class_id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "No class access" }, { status: 403 });
  }

  const { data: item } = await supabase
    .from("daily_playlist_items")
    .select("id,daily_playlist_id,xp")
    .eq("id", parsed.data.itemId)
    .eq("daily_playlist_id", parsed.data.dailyId)
    .maybeSingle<{ id: string; daily_playlist_id: string; xp: number | null }>();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("daily_progress")
    .select("id,status")
    .eq("daily_playlist_item_id", item.id)
    .eq("student_id", user.id)
    .maybeSingle<{ id: string; status: string }>();

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: now,
  };

  if (parsed.data.status === "in_progress") {
    update.started_at = now;
  }

  if (parsed.data.status === "submitted") {
    update.completed = true;
    update.submitted_at = now;
    if (parsed.data.evidenceUrl) {
      update.evidence_url = parsed.data.evidenceUrl;
    }
  }

  const { data: progress, error } = await supabase
    .from("daily_progress")
    .upsert(
      {
        id: existing?.id,
        daily_playlist_id: parsed.data.dailyId,
        daily_playlist_item_id: parsed.data.itemId,
        student_id: user.id,
        ...update,
      },
      { onConflict: "daily_playlist_item_id,student_id" },
    )
    .select("id,daily_playlist_item_id,status,score,evidence_url,submitted_at")
    .single();

  if (error || !progress) {
    return NextResponse.json({ error: error?.message ?? "Could not save progress" }, { status: 400 });
  }

  const service = createServiceClient();
  const isFirstSubmit = parsed.data.status === "submitted" && existing?.status !== "submitted" && existing?.status !== "graded";
  if (isFirstSubmit) {
    const gained = item.xp ?? 10;
    const coinGain = Math.ceil(gained / 2);

    const { data: xpRow } = await service.from("progress_xp").select("xp").eq("student_id", user.id).maybeSingle<{ xp: number }>();
    if (xpRow) {
      await service.from("progress_xp").update({ xp: xpRow.xp + gained }).eq("student_id", user.id);
    } else {
      await service.from("progress_xp").insert({ student_id: user.id, xp: gained });
    }

    const { data: wallet } = await service.from("wallets").select("coins").eq("student_id", user.id).maybeSingle<{ coins: number }>();
    if (wallet) {
      await service.from("wallets").update({ coins: wallet.coins + coinGain }).eq("student_id", user.id);
    } else {
      await service.from("wallets").insert({ student_id: user.id, coins: coinGain });
    }
  }

  await syncPlaylistWinners(parsed.data.dailyId, daily.class_id);

  const [{ data: playlistItems }, { data: playlistProgress }] = await Promise.all([
    service
      .from("daily_playlist_items")
      .select("id,skill_name,teks,xp")
      .eq("daily_playlist_id", parsed.data.dailyId)
      .order("order_index", { ascending: true }),
    service
      .from("daily_progress")
      .select("daily_playlist_item_id,status,score,evidence_url,submitted_at")
      .eq("daily_playlist_id", parsed.data.dailyId)
      .eq("student_id", user.id),
  ]);

  const completedCount = (playlistProgress ?? []).filter((row) => row.status === "submitted" || row.status === "graded").length;
  const evidenceCount = (playlistProgress ?? []).filter((row) => Boolean(row.evidence_url?.trim())).length;
  const combo = computePlaylistCombo(
    (playlistItems ?? []).map((row) => ({
      id: row.id as string,
      skill_name: (row.skill_name as string | null) ?? null,
      teks: (row.teks as string | null) ?? null,
      xp: Number(row.xp ?? 0),
    })),
    (playlistProgress ?? []).map((row) => ({
      daily_playlist_item_id: row.daily_playlist_item_id as string,
      status: row.status as string,
      score: (row.score as number | null) ?? null,
      evidence_url: (row.evidence_url as string | null) ?? null,
      submitted_at: (row.submitted_at as string | null) ?? null,
    })),
  );
  const badges = buildMissionBadges({
    streak: 0,
    combo,
    evidenceCount,
    completedCount,
    totalCount: playlistItems?.length ?? 0,
  });
  const earnedBadgeIds = badges.filter((badge) => badge.earned).map((badge) => badge.id);
  const chestOpened = Boolean(playlistItems?.length) && completedCount === playlistItems!.length;
  const nextSettingsJson = mergePersistedRewardState({
    settingsJson: profile?.settings_json ?? {},
    dailyId: parsed.data.dailyId,
    earnedBadgeIds,
    chestOpened,
  });

  await service.from("profiles").update({ settings_json: nextSettingsJson }).eq("id", user.id);

  return NextResponse.json({
    ok: true,
    progress,
    rewardState: {
      earnedBadgeIds,
      chestOpened,
    },
  });
}

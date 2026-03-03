"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const STUDENT_ID_REGEX = /^[A-Z][0-9]{6}$/;
const PIN_REGEX = /^[0-9]{6}$/;

export async function createClassAction(formData: FormData) {
  const { supabase, profile } = await getUserAndProfile("teacher");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await supabase.from("classes").insert({
    name,
    teacher_id: profile.id,
    school_id: profile.school_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/teacher/classes");
}

export async function createDailyForClassAction(formData: FormData) {
  const { supabase, profile } = await getUserAndProfile("teacher");
  const classId = String(formData.get("classId") ?? "");
  const date = String(formData.get("date") ?? "");

  const schema = z.string().date();
  const parsedDate = schema.safeParse(date);
  if (!classId || !parsedDate.success) return;

  const { data, error } = await supabase
    .from("daily_playlists")
    .upsert(
      {
        class_id: classId,
        date,
        created_by: profile.id,
        title: `Math Playlist ${date}`,
      },
      { onConflict: "class_id,date" },
    )
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create daily playlist.");
  }

  redirect(`/teacher/daily/${data.id}`);
}

export async function updateDailyMetaAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const dailyId = String(formData.get("dailyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!dailyId) return;

  const { error } = await supabase
    .from("daily_playlists")
    .update({ title, notes })
    .eq("id", dailyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/daily/${dailyId}`);
  revalidatePath(`/student/today`);
}

export async function togglePublishAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const dailyId = String(formData.get("dailyId") ?? "");
  const published = String(formData.get("published") ?? "false") === "true";
  if (!dailyId) return;

  const { error } = await supabase.from("daily_playlists").update({ published }).eq("id", dailyId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/daily/${dailyId}`);
  revalidatePath(`/student/today`);
}

export async function addDailyItemAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const dailyId = String(formData.get("dailyId") ?? "");
  if (!dailyId) return;

  const { count } = await supabase
    .from("daily_playlist_items")
    .select("*", { count: "exact", head: true })
    .eq("daily_playlist_id", dailyId);

  const payload = {
    daily_playlist_id: dailyId,
    order_index: count,
    teks: String(formData.get("teks") ?? "").trim(),
    skill_name: String(formData.get("skill") ?? "").trim(),
    type: String(formData.get("type") ?? "independent").trim(),
    url: String(formData.get("url") ?? "").trim(),
    xp: Number(formData.get("xp") ?? 10),
    max_score: formData.get("maxScore") ? Number(formData.get("maxScore")) : null,
  };

  const { error } = await supabase.from("daily_playlist_items").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/daily/${dailyId}`);
}

export async function moveDailyItemAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const dailyId = String(formData.get("dailyId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const direction = String(formData.get("direction") ?? "up");

  if (!dailyId || !itemId) return;

  const { data: items } = await supabase
    .from("daily_playlist_items")
    .select("id,order_index")
    .eq("daily_playlist_id", dailyId)
    .order("order_index", { ascending: true });

  if (!items || items.length < 2) return;
  const index = items.findIndex((row) => row.id === itemId);
  if (index < 0) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];

  await supabase.from("daily_playlist_items").update({ order_index: -999 }).eq("id", a.id);
  await supabase.from("daily_playlist_items").update({ order_index: a.order_index }).eq("id", b.id);
  await supabase.from("daily_playlist_items").update({ order_index: b.order_index }).eq("id", a.id);

  revalidatePath(`/teacher/daily/${dailyId}`);
}

export async function createStudentAndAssignAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const classId = String(formData.get("classId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").toUpperCase().trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!classId || !fullName || !STUDENT_ID_REGEX.test(studentId) || !PIN_REGEX.test(pin)) {
    throw new Error("Invalid student input.");
  }

  const email = `${studentId}@students.example.com`;
  const service = createServiceClient();

  const { data: userData, error: createError } = await service.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { full_name: fullName, student_id: studentId },
  });

  if (createError || !userData.user) {
    throw new Error(createError?.message ?? "Could not create student account.");
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: userData.user.id,
    email,
    full_name: fullName,
    role: "student",
    settings_json: { student_id: studentId },
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: rosterError } = await supabase.from("class_students").upsert({
    class_id: classId,
    student_id: userData.user.id,
  });

  if (rosterError) {
    throw new Error(rosterError.message);
  }

  await service.from("wallets").upsert({ student_id: userData.user.id, coins: 0 });
  await service.from("progress_xp").upsert({ student_id: userData.user.id, xp: 0 });

  revalidatePath(`/teacher/classes/${classId}`);
}

export async function gradeProgressAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const progressId = String(formData.get("progressId") ?? "");
  const dailyId = String(formData.get("dailyId") ?? "");
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const note = String(formData.get("teacherNote") ?? "").trim();

  if (!progressId || !dailyId) return;

  const score = scoreRaw.length ? Number(scoreRaw) : null;
  const { error } = await supabase
    .from("daily_progress")
    .update({
      score,
      teacher_note: note || null,
      status: "graded",
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", progressId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/daily/${dailyId}/tracker`);
}

export async function assignExistingStudentAction(formData: FormData) {
  const { supabase } = await getUserAndProfile("teacher");
  const classId = String(formData.get("classId") ?? "");
  const studentId = String(formData.get("studentProfileId") ?? "").trim();
  if (!classId || !studentId) return;

  const { error } = await supabase.from("class_students").upsert({
    class_id: classId,
    student_id: studentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/classes/${classId}`);
}

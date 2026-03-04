"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const STUDENT_ID_REGEX = /^[A-Z][0-9]{7}$/;
const PIN_REGEX = /^[0-9]{6}$/;

const M_TOOL_OPTIONS = [
  "PVC (Place Value Chart)",
  "120 Chart",
  "AM (Area Model)",
  "UPSC (Understand, Plan, Solve, Check)",
  "PSF Chart (Problem Solve Flow Chart)",
] as const;

const MATERIAL_OPTIONS = [
  "Strategy sheet",
  "Dry eraser markers",
  "Pencil",
  "Laptop",
] as const;

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
  const instructions = String(formData.get("instructions") ?? "").trim();
  const studentObjective = String(formData.get("studentObjective") ?? "").trim();
  const teks = String(formData.get("teks") ?? "").trim();
  const mTools = formData
    .getAll("mTools")
    .map((value) => String(value))
    .filter((value): value is (typeof M_TOOL_OPTIONS)[number] => M_TOOL_OPTIONS.includes(value as (typeof M_TOOL_OPTIONS)[number]));
  const materials = formData
    .getAll("materials")
    .map((value) => String(value))
    .filter((value): value is (typeof MATERIAL_OPTIONS)[number] => MATERIAL_OPTIONS.includes(value as (typeof MATERIAL_OPTIONS)[number]));

  if (!dailyId) return;

  const { error } = await supabase
    .from("daily_playlists")
    .update({
      title,
      instructions: instructions || null,
      student_objective: studentObjective || null,
      teks: teks || null,
      m_tools: mTools,
      materials,
    })
    .eq("id", dailyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/daily/${dailyId}`);
  revalidatePath(`/student/today`);
  redirect(`/teacher/daily/${dailyId}?saved=header`);
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
  const { supabase, profile } = await getUserAndProfile("teacher");
  const classId = String(formData.get("classId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").toUpperCase().trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!classId || !fullName || !STUDENT_ID_REGEX.test(studentId) || !PIN_REGEX.test(pin)) {
    throw new Error("Invalid student input.");
  }

  const email = `s-${studentId}@mathplaylist.app`;
  const service = createServiceClient();
  let userId: string | null = null;

  const { data: ownedClass } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", profile.id)
    .maybeSingle<{ id: string }>();

  if (!ownedClass) {
    throw new Error("You can only assign students to your own class.");
  }

  const { data: userData, error: createError } = await service.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { full_name: fullName, student_id: studentId, role: "student" },
  });

  if (createError) {
    const alreadyExists = createError.message.toLowerCase().includes("already");
    if (!alreadyExists) {
      throw new Error(createError.message);
    }

    const { data: existingProfile } = await service
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle<{ id: string }>();

    if (!existingProfile?.id) {
      throw new Error("Student exists in auth but profile is missing. Create profile first.");
    }

    userId = existingProfile.id;
    await service.auth.admin.updateUserById(userId, {
      password: pin,
      user_metadata: { full_name: fullName, student_id: studentId, role: "student" },
    });
  } else if (userData?.user) {
    userId = userData.user.id;
  }

  if (!userId) {
    throw new Error("Could not resolve student account.");
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "student",
    settings_json: { student_id: studentId },
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: rosterError } = await service.from("class_students").upsert({
    class_id: classId,
    student_id: userId,
  });

  if (rosterError) {
    throw new Error(rosterError.message);
  }

  await service.from("wallets").upsert({ student_id: userId, coins: 0 });
  await service.from("progress_xp").upsert({ student_id: userId, xp: 0 });

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

export async function resetStudentPinAction(formData: FormData) {
  const { supabase, profile } = await getUserAndProfile("teacher");
  const classId = String(formData.get("classId") ?? "").trim();
  const studentProfileId = String(formData.get("studentProfileId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!classId || !studentProfileId || !PIN_REGEX.test(pin)) {
    throw new Error("PIN must be exactly 6 digits.");
  }

  const { data: classRow } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", profile.id)
    .maybeSingle<{ id: string }>();

  if (!classRow) {
    throw new Error("You can only manage students in your own class.");
  }

  const { data: rosterRow } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId)
    .eq("student_id", studentProfileId)
    .maybeSingle<{ student_id: string }>();

  if (!rosterRow) {
    throw new Error("Student is not assigned to this class.");
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(studentProfileId, {
    password: pin,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teacher/classes/${classId}`);
}

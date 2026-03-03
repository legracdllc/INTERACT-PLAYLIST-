import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function getUserAndProfile(requiredRole?: Role) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,school_id,avatar_json,settings_json,created_at")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    redirect("/login?error=missing_profile");
  }

  if (requiredRole && profile.role !== requiredRole) {
    redirect(profile.role === "teacher" ? "/teacher/dashboard" : "/student/today");
  }

  return { supabase, user, profile };
}

export async function getStudentClassIds(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", studentId);

  if (error) {
    return [] as string[];
  }

  return (data ?? []).map((row) => row.class_id as string);
}

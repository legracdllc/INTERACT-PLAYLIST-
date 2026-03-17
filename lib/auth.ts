import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile, Role } from "@/lib/types";

const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,school_id,avatar_json,settings_json,created_at")
    .eq("id", user.id)
    .single<Profile>();

  const inferredRole = (user.user_metadata?.role ?? user.app_metadata?.role ?? null) as Role | null;

  if (!profile) {
    if (inferredRole === "teacher" || inferredRole === "student") {
      const service = createServiceClient();
      await service.from("profiles").upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? inferredRole,
        role: inferredRole,
      });

      const retry = await supabase
        .from("profiles")
        .select("id,email,full_name,role,school_id,avatar_json,settings_json,created_at")
        .eq("id", user.id)
        .single<Profile>();

      profile = retry.data ?? null;
    }
  }

  if (!profile && (inferredRole === "teacher" || inferredRole === "student")) {
    profile = {
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? inferredRole,
      role: inferredRole,
      school_id: null,
      avatar_json: {},
      settings_json: {},
      created_at: new Date().toISOString(),
    };
  }

  if (!profile) {
    redirect("/login?error=missing_profile");
  }

  return { supabase, user, profile };
});

export async function getUserAndProfile(requiredRole?: Role) {
  const { supabase, user, profile } = await getSessionProfile();

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

export async function getStudentClassIdsRobust(studentId: string) {
  const directIds = await getStudentClassIds(studentId);
  if (directIds.length) {
    return directIds;
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("class_students")
    .select("class_id")
    .eq("student_id", studentId);

  if (error) {
    return [] as string[];
  }

  return (data ?? []).map((row) => row.class_id as string);
}

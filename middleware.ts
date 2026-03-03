import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/middleware";

const STUDENT_PREFIX = "/student";
const TEACHER_PREFIX = "/teacher";

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await refreshSession(request);
  const path = request.nextUrl.pathname;

  const isProtected = path.startsWith(STUDENT_PREFIX) || path.startsWith(TEACHER_PREFIX);
  if (!isProtected) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "student" | "teacher" }>();

  if (!profile) {
    return NextResponse.redirect(new URL("/login?error=missing_profile", request.url));
  }

  if (path.startsWith(STUDENT_PREFIX) && profile.role !== "student") {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  if (path.startsWith(TEACHER_PREFIX) && profile.role !== "teacher") {
    return NextResponse.redirect(new URL("/student/today", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"],
};

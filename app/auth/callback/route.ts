import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/teacher/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata.full_name ?? data.user.user_metadata.name ?? "Teacher",
      role: "teacher",
    });
  }

  const safeNext = next.startsWith("/") ? next : "/teacher/dashboard";
  return NextResponse.redirect(new URL(safeNext, request.url));
}

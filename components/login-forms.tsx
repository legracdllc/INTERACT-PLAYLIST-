"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STUDENT_ID_REGEX = /^[A-Z][0-9]{6}$/;
const PIN_REGEX = /^[0-9]{6}$/;

export function LoginForms() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);
  const router = useRouter();
  const query = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleTeacherLogin() {
    setError(null);
    const next = query.get("next") ?? "/teacher/dashboard";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    if (!supabase) return;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (authError) {
      setError(authError.message);
    }
  }

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);

    const rawId = String(data.get("studentId") ?? "").toUpperCase().trim();
    const pin = String(data.get("pin") ?? "").trim();
    if (!STUDENT_ID_REGEX.test(rawId)) {
      setError("Student ID must be 1 letter + 6 digits.");
      return;
    }
    if (!PIN_REGEX.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    startTransition(async () => {
      if (!supabase) return;
      const derivedEmail = `${rawId}@students.example.com`;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: derivedEmail,
        password: pin,
      });

      if (authError) {
        setError("Invalid Student ID or PIN.");
        return;
      }

      router.push("/student/today");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="panel p-6">
        <h2 className="font-display text-2xl font-bold">Teacher Login</h2>
        <p className="mt-2 text-sm text-slate-600">Use Google OAuth with your teacher account.</p>
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={handleTeacherLogin} disabled={pending}>
          Continue with Google
        </button>
      </section>

      <section className="panel p-6">
        <h2 className="font-display text-2xl font-bold">Student Login</h2>
        <p className="mt-2 text-sm text-slate-600">Use campus Student ID + 6 digit PIN.</p>
        <form className="mt-5 space-y-3" onSubmit={handleStudentSubmit}>
          <label className="block">
            <span className="text-sm font-bold">Student ID</span>
            <input name="studentId" required pattern="[A-Z][0-9]{6}" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase" placeholder="A123456" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">PIN</span>
            <input name="pin" required pattern="[0-9]{6}" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="123456" />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>Sign In</button>
        </form>
      </section>

      {error ? <p className="md:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

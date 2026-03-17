"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ID_PATTERN = /^[A-Z][0-9]{7}$/;
const PIN_PATTERN = /^[0-9]{6}$/;
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1";

function teacherEmail(username: string) {
  return `t-${username}@mathplaylist.app`;
}

function studentEmail(studentId: string) {
  return `s-${studentId}@mathplaylist.app`;
}

function normalizeTeacherUsername(value: string) {
  const trimmed = value.trim();
  return trimmed.toLowerCase() === ADMIN_USERNAME ? ADMIN_USERNAME : trimmed.toUpperCase();
}

type LoginMode = "teacher" | "student";

function getFriendlyErrorMessage(raw: string | null) {
  if (!raw) return "";

  switch (raw) {
    case "missing_profile":
      return "Your account signed in, but the profile record was missing. Please try again.";
    case "oauth_failed":
      return "The sign-in flow could not finish. Please try again.";
    case "missing_code":
      return "The sign-in callback was incomplete. Please try again.";
    default:
      return raw.replaceAll("_", " ");
  }
}

export function LoginForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("teacher");
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentPin, setStudentPin] = useState("");
  const [error, setError] = useState(getFriendlyErrorMessage(searchParams.get("error")));
  const [isPending, startTransition] = useTransition();

  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : null;

  function handleTeacherSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const username = normalizeTeacherUsername(teacherUsername);
    const password = teacherPassword.trim();
    const fullName = teacherName.trim();
    const isAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!isAdmin && !ID_PATTERN.test(username)) {
      setError("Teacher username must look like A1234567, or use admin.");
      return;
    }

    if (!isAdmin && !PIN_PATTERN.test(password)) {
      setError("Teacher password must be exactly 6 digits, or use admin1.");
      return;
    }

    startTransition(async () => {
      try {
        const bootstrapRes = await fetch("/api/auth/teacher/bootstrap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            fullName: fullName || username,
          }),
        });

        const bootstrapBody = await bootstrapRes.json().catch(() => null) as { error?: string } | null;
        if (!bootstrapRes.ok) {
          throw new Error(bootstrapBody?.error ?? "Could not prepare teacher account.");
        }

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: teacherEmail(username),
          password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        router.push(safeNext ?? "/teacher/dashboard");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Teacher sign-in failed.");
      }
    });
  }

  function handleStudentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedStudentId = studentId.toUpperCase().trim();
    const pin = studentPin.trim();

    if (!ID_PATTERN.test(normalizedStudentId)) {
      setError("Student ID must look like A1234567.");
      return;
    }

    if (!PIN_PATTERN.test(pin)) {
      setError("Student PIN must be exactly 6 digits.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: studentEmail(normalizedStudentId),
          password: pin,
        });

        if (signInError) {
          throw new Error("Student sign-in failed. Check the Student ID and PIN.");
        }

        router.push(safeNext ?? "/student/today");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Student sign-in failed.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="panel flex flex-col gap-2 p-3">
        <button
          type="button"
          onClick={() => {
            setMode("teacher");
            setError("");
          }}
          className={mode === "teacher" ? "btn btn-primary justify-start" : "btn justify-start border border-white/20 bg-white/10"}
        >
          Teacher Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("student");
            setError("");
          }}
          className={mode === "student" ? "btn btn-primary justify-start" : "btn justify-start border border-white/20 bg-white/10"}
        >
          Student Login
        </button>
      </aside>

      <section className="panel p-5">
        {mode === "teacher" ? (
          <form className="space-y-4" onSubmit={handleTeacherSubmit}>
            <div>
                <h2 className="font-display text-2xl font-bold">Teacher Sign In</h2>
              <p className="mt-1 text-sm text-indigo-100/80">
                Use your school ID and 6-digit password. Reserved admin login: admin / admin1.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold">Full Name</span>
              <input
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-slate-300"
                placeholder="Ms. Rivera"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Username</span>
              <input
                value={teacherUsername}
                onChange={(event) => setTeacherUsername(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 uppercase text-white outline-none placeholder:text-slate-300"
                placeholder="A1234567 or admin"
                maxLength={8}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Password</span>
              <input
                value={teacherPassword}
                onChange={(event) => setTeacherPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-slate-300"
                placeholder="123456 or admin1"
                inputMode="text"
                maxLength={6}
                required
              />
            </label>

            <button disabled={isPending} className="btn btn-primary">
              {isPending ? "Signing In..." : "Enter Teacher Console"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleStudentSubmit}>
            <div>
              <h2 className="font-display text-2xl font-bold">Student Sign In</h2>
              <p className="mt-1 text-sm text-indigo-100/80">
                Students sign in with their assigned Student ID and 6-digit PIN.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold">Student ID</span>
              <input
                value={studentId}
                onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 uppercase text-white outline-none placeholder:text-slate-300"
                placeholder="A1234567"
                maxLength={8}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">PIN</span>
              <input
                value={studentPin}
                onChange={(event) => setStudentPin(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-slate-300"
                placeholder="123456"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </label>

            <button disabled={isPending} className="btn btn-primary">
              {isPending ? "Signing In..." : "Enter Student Arena"}
            </button>
          </form>
        )}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

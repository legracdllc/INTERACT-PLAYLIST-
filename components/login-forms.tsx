"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STUDENT_ID_REGEX = /^[A-Z][0-9]{7}$/;
const PIN_REGEX = /^[0-9]{6}$/;
const TEACHER_USERNAME_REGEX = /^[A-Z][0-9]{7}$/;
const TEACHER_PASSWORD_REGEX = /^[0-9]{6}$/;

function teacherEmails(username: string) {
  const id = username.toUpperCase();
  return [
    `t-${id}@mathplaylist.app`,
    `${id}@teachers.mathplaylist.app`,
    `${id}@teachers.example.com`,
  ];
}

function studentEmails(studentId: string) {
  const id = studentId.toUpperCase();
  return [
    `s-${id}@mathplaylist.app`,
    `${id}@students.mathplaylist.app`,
    `${id}@students.example.com`,
  ];
}

async function bootstrapTeacher(username: string, password: string, fullName?: string) {
  const res = await fetch("/api/auth/teacher/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password, fullName }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Could not create teacher account.");
  }
}

export function LoginForms() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function ensureTeacherProfile() {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Teacher",
      role: "teacher",
    });
  }

  function handleTeacherSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const username = String(data.get("teacherUsername") ?? "").toUpperCase().trim();
    const password = String(data.get("teacherPassword") ?? "").trim();

    if (!TEACHER_USERNAME_REGEX.test(username)) {
      setError("Teacher username must be 1 letter + 7 digits.");
      return;
    }
    if (!TEACHER_PASSWORD_REGEX.test(password)) {
      setError("Teacher password must be exactly 6 digits.");
      return;
    }

    startTransition(async () => {
      if (!supabase) return;
      let signedIn = false;
      let lastErrorMessage = "Invalid teacher username or password.";

      for (const email of teacherEmails(username)) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError) {
          signedIn = true;
          break;
        }

        const msg = authError.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          lastErrorMessage = "Teacher account exists but email is not confirmed. Disable email confirmation in Supabase Email provider for local use.";
          break;
        }
        lastErrorMessage = "Invalid teacher username or password.";
      }

      if (!signedIn) {
        try {
          await bootstrapTeacher(username, password, username);
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: teacherEmails(username)[0],
            password,
          });
          if (retryError) {
            setError(lastErrorMessage);
            return;
          }
        } catch (bootstrapError) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : lastErrorMessage);
          return;
        }
      }

      await ensureTeacherProfile();
      router.push("/teacher/dashboard");
      router.refresh();
    });
  }

  function handleTeacherCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const username = String(data.get("newTeacherUsername") ?? "").toUpperCase().trim();
    const fullName = String(data.get("teacherFullName") ?? "").trim();
    const password = String(data.get("newTeacherPassword") ?? "").trim();

    if (!TEACHER_USERNAME_REGEX.test(username)) {
      setError("Teacher username must be 1 letter + 7 digits.");
      return;
    }
    if (!TEACHER_PASSWORD_REGEX.test(password)) {
      setError("Teacher password must be exactly 6 digits.");
      return;
    }

    startTransition(async () => {
      if (!supabase) return;
      try {
        await bootstrapTeacher(username, password, fullName || username);
      } catch (bootstrapError) {
        setError(bootstrapError instanceof Error ? bootstrapError.message : "Could not create teacher account.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: teacherEmails(username)[0],
        password,
      });

      if (signInError) {
        setMessage("Teacher account created. Try Teacher Sign In now.");
        return;
      }

      await ensureTeacherProfile();
      router.push("/teacher/dashboard");
      router.refresh();
    });
  }

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const data = new FormData(event.currentTarget);

    const rawId = String(data.get("studentId") ?? "").toUpperCase().trim();
    const pin = String(data.get("pin") ?? "").trim();
    if (!STUDENT_ID_REGEX.test(rawId)) {
      setError("Student ID must be 1 letter + 7 digits.");
      return;
    }
    if (!PIN_REGEX.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    startTransition(async () => {
      if (!supabase) return;
      let signedIn = false;
      for (const email of studentEmails(rawId)) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: pin,
        });
        if (!authError) {
          signedIn = true;
          break;
        }
      }

      if (!signedIn) {
        setError("Invalid Student ID or PIN.");
        return;
      }

      router.push("/student/today");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-white/20 bg-black/25 p-6 backdrop-blur">
        <h2 className="font-display text-2xl font-bold text-white">Teacher Login</h2>
        <p className="mt-2 text-sm text-indigo-100/90">Use school ID format (1 letter + 7 digits) + password.</p>

        <form className="mt-4 space-y-3" noValidate onSubmit={handleTeacherSignIn}>
          <label className="block">
            <span className="text-sm font-bold text-cyan-100">Username</span>
            <input name="teacherUsername" required pattern="[A-Za-z][0-9]{7}" className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 uppercase text-white" placeholder="A1234567" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-cyan-100">Password</span>
            <input name="teacherPassword" type="password" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white" placeholder="123456" />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>Teacher Sign In</button>
        </form>

        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="text-sm font-bold text-cyan-100">Create Teacher Account</p>
          <form className="mt-3 space-y-3" noValidate onSubmit={handleTeacherCreate}>
            <input name="teacherFullName" className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white" placeholder="Full name (optional)" />
            <input name="newTeacherUsername" required pattern="[A-Za-z][0-9]{7}" className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 uppercase text-white" placeholder="A1234567" />
            <input name="newTeacherPassword" type="password" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white" placeholder="123456" />
            <button type="submit" className="btn border border-white/20 bg-white/10 text-white w-full" disabled={pending}>Create Teacher Account</button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-white/20 bg-black/25 p-6 backdrop-blur">
        <h2 className="font-display text-2xl font-bold text-white">Student Login</h2>
        <p className="mt-2 text-sm text-indigo-100/90">Use campus Student ID + 6 digit PIN.</p>
        <form className="mt-5 space-y-3" noValidate onSubmit={handleStudentSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-cyan-100">Student ID</span>
            <input name="studentId" required pattern="[A-Za-z][0-9]{7}" className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 uppercase text-white" placeholder="A1234567" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-cyan-100">PIN</span>
            <input name="pin" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white" placeholder="123456" />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>Student Sign In</button>
        </form>
      </section>

      {error ? <p className="md:col-span-2 rounded-lg border border-rose-300/30 bg-rose-500/15 p-3 text-sm text-rose-100">{error}</p> : null}
      {message ? <p className="md:col-span-2 rounded-lg border border-emerald-300/30 bg-emerald-500/15 p-3 text-sm text-emerald-100">{message}</p> : null}
    </div>
  );
}

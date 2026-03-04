import Link from "next/link";
import { Suspense } from "react";
import { LoginForms } from "@/components/login-forms";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-14 text-slate-100">
      <Link href="/" className="text-sm font-bold text-cyan-300">Back Home</Link>
      <section className="panel game-shell relative mt-3 p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-extrabold">Enter the Arena</h1>
          <p className="mt-2 text-indigo-100/90">Teachers use username + password. Students use Student ID + PIN.</p>
        </div>
        <div className="relative z-10 mt-8">
          <Suspense fallback={<p className="panel p-4 text-sm text-slate-100">Loading login...</p>}>
            <LoginForms />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

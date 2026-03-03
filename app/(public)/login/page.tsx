import Link from "next/link";
import { Suspense } from "react";
import { LoginForms } from "@/components/login-forms";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-14">
      <Link href="/" className="text-sm font-bold text-sky-700">Back Home</Link>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Login to Math Playlist</h1>
      <p className="mt-2 text-slate-600">Teachers use Google. Students use Student ID + PIN.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="panel p-4 text-sm text-slate-600">Loading login...</p>}>
          <LoginForms />
        </Suspense>
      </div>
    </main>
  );
}

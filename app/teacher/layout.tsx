import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { ThemeBackdrop } from "@/components/theme-backdrop";
import { LionSurroundings } from "@/components/lion-surroundings";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUserAndProfile("teacher");

  return (
    <div className="scene-base scene-teacher teacher-theme relative min-h-screen overflow-hidden">
      <ThemeBackdrop variant="teacher" />
      <LionSurroundings />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <header className="panel relative mb-6 flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Teacher Console</p>
            <h1 className="font-display text-2xl font-extrabold">Math Playlist</h1>
            <p className="text-sm text-slate-500">{profile.full_name}</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link className="btn border border-slate-200 bg-white" href="/teacher/dashboard">Dashboard</Link>
            <Link className="btn border border-slate-200 bg-white" href="/teacher/classes">Classes</Link>
            <form action="/auth/signout" method="post"><button className="btn border border-slate-200 bg-white">Sign Out</button></form>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUserAndProfile("student");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <header className="panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Student Zone</p>
          <h1 className="font-display text-2xl font-extrabold">Math Playlist</h1>
          <p className="text-sm text-slate-500">{profile.full_name}</p>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link className="btn border border-slate-200 bg-white" href="/student/today">Today</Link>
          <Link className="btn border border-slate-200 bg-white" href="/student/dashboard">Dashboard</Link>
          <Link className="btn border border-slate-200 bg-white" href="/student/leaderboard">Leaderboard</Link>
          <form action="/auth/signout" method="post"><button className="btn border border-slate-200 bg-white">Sign Out</button></form>
        </nav>
      </header>
      {children}
    </div>
  );
}

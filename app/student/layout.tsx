import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { ThemeBackdrop } from "@/components/theme-backdrop";
import { LionSurroundings } from "@/components/lion-surroundings";

const navItems = [
  { href: "/student/today", label: "Mission" },
  { href: "/student/dashboard", label: "Progress" },
  { href: "/student/leaderboard", label: "Rank" },
  { href: "/student/store", label: "Store" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUserAndProfile("student");

  return (
    <div className="scene-base scene-student relative min-h-screen overflow-hidden">
      <ThemeBackdrop variant="student" />
      <LionSurroundings />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 text-slate-100 md:px-8">
        <header className="panel game-shell spark relative mb-6 flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4 md:p-5">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Player Zone</p>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">Math Playlist Arena</h1>
            <p className="text-sm text-indigo-100/80">{profile.full_name}</p>
          </div>
          <nav className="relative z-10 flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} className="btn border border-white/20 bg-white/10 text-slate-100" href={item.href}>{item.label}</Link>
            ))}
            <form action="/auth/signout" method="post"><button className="btn border border-white/20 bg-white/10 text-slate-100">Exit</button></form>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { ThemeBackdrop } from "@/components/theme-backdrop";
import { LionSurroundings } from "@/components/lion-surroundings";
import { StudentAvatarRenderer } from "@/components/student-avatar-renderer";

const navItems = [
  { href: "/student/today", label: "Mission" },
  { href: "/student/dashboard", label: "Progress" },
  { href: "/student/leaderboard", label: "Rank" },
  { href: "/student/avatar", label: "Avatar" },
  { href: "/student/store", label: "Store" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await getUserAndProfile("student");
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();

  return (
    <div className="scene-base scene-student relative min-h-screen overflow-hidden">
      <ThemeBackdrop variant="student" />
      <LionSurroundings />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 text-slate-100 md:px-8">
        <header className="panel game-shell spark panel-playful relative mb-6 flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4 md:p-5">
          <div className="math-corner-doodles" aria-hidden="true" />
          <div className="relative z-10">
            <p className="poster-ribbon">Player Zone</p>
            <h1 className="mt-3 font-display text-2xl font-extrabold md:text-3xl">Math Playlist Arena</h1>
            <p className="text-sm text-indigo-100/80">{profile.full_name}</p>
            <div className="poster-chip-row">
              <span className="poster-chip poster-chip-mission">Poster Quest</span>
              <span className="poster-chip poster-chip-star">Math Power</span>
            </div>
          </div>
          <div className="relative z-10 hidden md:block">
            <StudentAvatarRenderer avatar={profile.avatar_json} size="sm" showLabel name={profile.full_name} xp={xpRow?.xp ?? 0} />
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

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 text-slate-100">
      <section className="panel game-shell spark relative p-8 md:p-12">
        <div className="relative z-10 grid gap-8 md:grid-cols-[1.15fr,0.85fr] md:items-center">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Campus MVP</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">Math Playlist Arena</h1>
            <p className="mt-4 max-w-2xl text-lg text-indigo-100/90">
              A game-style daily math system where each activity is a level and every submission earns progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">Launch Login</Link>
              <Link href="/teacher/dashboard" className="btn border border-white/20 bg-white/10 text-white">Teacher Console</Link>
              <Link href="/student/today" className="btn border border-white/20 bg-white/10 text-white">Student Arena</Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="panel p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-cyan-200">World 1</p>
              <p className="font-bold">Mini Lesson</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-pink-200">World 2</p>
              <p className="font-bold">Guided Practice</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-lime-200">World 3</p>
              <p className="font-bold">Challenge + Exit Ticket</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

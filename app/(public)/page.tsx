import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <section className="panel p-8 md:p-12">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Campus MVP</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">Math Playlist</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Build and run daily math playlists by class. Students complete items, teachers track every step,
          and grading stays in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn btn-primary">Login</Link>
          <Link href="/teacher/dashboard" className="btn border border-slate-200 bg-white">Teacher View</Link>
          <Link href="/student/today" className="btn border border-slate-200 bg-white">Student View</Link>
        </div>
      </section>
    </main>
  );
}

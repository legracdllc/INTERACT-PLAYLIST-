export default function StudentLoading() {
  return (
    <main className="space-y-5">
      <section className="panel game-shell animate-pulse p-6">
        <div className="h-5 w-40 rounded bg-cyan-200/40" />
        <div className="mt-3 h-10 w-72 rounded bg-cyan-100/30" />
        <div className="mt-3 h-4 w-96 rounded bg-indigo-100/20" />
      </section>
      <section className="panel animate-pulse p-5">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-4 h-52 rounded-xl bg-slate-100" />
      </section>
    </main>
  );
}

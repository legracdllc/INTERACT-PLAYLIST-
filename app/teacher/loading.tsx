function SkeletonCard() {
  return (
    <section className="panel animate-pulse p-5">
      <div className="h-6 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
    </section>
  );
}

export default function TeacherLoading() {
  return (
    <main className="space-y-6">
      <section className="panel animate-pulse p-5">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 rounded bg-slate-100" />
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}

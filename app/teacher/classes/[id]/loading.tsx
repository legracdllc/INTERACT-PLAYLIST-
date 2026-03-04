export default function TeacherClassDetailLoading() {
  return (
    <main className="space-y-6">
      <section className="panel animate-pulse p-5">
        <div className="h-8 w-72 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel animate-pulse p-5">
          <div className="h-6 w-56 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
        </article>
        <article className="panel animate-pulse p-5">
          <div className="h-6 w-56 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-200" />
            <div className="h-28 rounded-xl bg-slate-100" />
          </div>
        </article>
      </section>
    </main>
  );
}

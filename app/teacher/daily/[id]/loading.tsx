export default function TeacherDailyLoading() {
  return (
    <main className="space-y-6">
      <section className="panel animate-pulse p-5">
        <div className="h-8 w-72 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-200 md:col-span-2" />
        </div>
      </section>
      <section className="panel animate-pulse p-5">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-36 rounded-xl bg-slate-100" />
      </section>
    </main>
  );
}

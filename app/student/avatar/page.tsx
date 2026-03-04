import { getUserAndProfile } from "@/lib/auth";

export default async function StudentAvatarPage() {
  const { profile } = await getUserAndProfile("student");

  return (
    <main className="panel p-5">
      <h2 className="font-display text-2xl font-bold">Avatar Lab</h2>
      <p className="mt-1 text-sm text-indigo-100/85">Customize look data for your player card.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px,1fr]">
        <div className="rounded-xl border border-white/20 bg-black/20 p-4">
          <div className="mascot mx-auto bg-gradient-to-br from-cyan-300 to-blue-500"><div className="mascot-mouth" /></div>
          <p className="mt-3 text-center text-sm text-cyan-100">Current Avatar Preview</p>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-white/20 bg-slate-950/70 p-4 text-xs text-slate-100">{JSON.stringify(profile.avatar_json ?? {}, null, 2)}</pre>
      </div>
    </main>
  );
}

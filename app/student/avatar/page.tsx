import { getUserAndProfile } from "@/lib/auth";

export default async function StudentAvatarPage() {
  const { profile } = await getUserAndProfile("student");

  return (
    <main className="panel p-5">
      <h2 className="font-display text-2xl font-bold">Avatar</h2>
      <p className="mt-2 text-sm text-slate-600">Simple JSON-based avatar settings for future cosmetics.</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(profile.avatar_json ?? {}, null, 2)}</pre>
    </main>
  );
}

import { getUserAndProfile } from "@/lib/auth";
import { StudentAvatarBuilder } from "@/components/student-avatar-builder";

export default async function StudentAvatarPage() {
  const { profile, supabase } = await getUserAndProfile("student");
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();
  const xp = xpRow?.xp ?? 0;

  return (
    <main className="space-y-5">
      <section className="poster-hero avatar-page-hero">
        <div className="avatar-page-burst" aria-hidden="true" />
        <div className="relative z-10">
          <p className="poster-ribbon">Avatar Lab</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-900">Build Your Poster Lion Hero</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Design a lion champion inspired by your math posters. Your hero keeps the same style across playlists, podiums, missions, and the class leaderboard.</p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-mission">Lion hero creator</span>
            <span className="poster-chip poster-chip-star">{xp} XP collected</span>
            <span className="poster-chip poster-chip-math">Poster worlds unlocked</span>
          </div>
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="avatar-info-card">
          <p className="avatar-info-kicker">Mane + Mood</p>
          <h3 className="avatar-info-title">Pick a hero vibe</h3>
          <p className="avatar-info-copy">Every mane changes the energy of your lion, from speedy poster racer to royal math champion.</p>
        </article>
        <article className="avatar-info-card">
          <p className="avatar-info-kicker">Suit + Tool</p>
          <h3 className="avatar-info-title">Match the poster world</h3>
          <p className="avatar-info-copy">Outfits and math tools should feel like they belong to Graph Guardian, Measure King, Geo Cub, and the rest.</p>
        </article>
        <article className="avatar-info-card">
          <p className="avatar-info-kicker">Buddy + Motion</p>
          <h3 className="avatar-info-title">Give it personality</h3>
          <p className="avatar-info-copy">A great avatar is not just a costume. It should look alive, playful, and ready to travel across every playlist.</p>
        </article>
      </section>
      <StudentAvatarBuilder initialAvatar={profile.avatar_json} playerName={profile.full_name} xp={xp} />
    </main>
  );
}

import { getUserAndProfile } from "@/lib/auth";
import { AVATAR_LEVELS } from "@/lib/avatar";
import { STORE_ITEMS } from "@/lib/store";
import { createServiceClient } from "@/lib/supabase/service";
import { StudentStoreClient } from "@/components/student-store-client";

export default async function StudentStorePage() {
  const { profile, supabase } = await getUserAndProfile("student");
  const service = createServiceClient();
  const { data: xpRow } = await supabase.from("progress_xp").select("xp").eq("student_id", profile.id).maybeSingle<{ xp: number }>();
  const { data: wallet } = await service.from("wallets").select("coins").eq("student_id", profile.id).maybeSingle<{ coins: number }>();
  const { data: ownedItems } = await service
    .from("student_inventory")
    .select("item_key,is_equipped")
    .eq("student_id", profile.id);
  const xp = xpRow?.xp ?? 0;

  return (
    <main className="space-y-4">
      <section className="panel game-shell spark panel-playful p-5 md:p-6">
        <div className="math-corner-doodles" aria-hidden="true" />
        <div className="relative z-10">
          <p className="poster-ribbon">Reward Shop</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">Coin Store</h2>
          <p className="mt-1 max-w-2xl text-sm text-indigo-100/90">Unlock style items for your avatar and mission board. What you equip should change the whole feel of your math adventure, not just add a tiny icon.</p>
          <div className="poster-chip-row">
            <span className="poster-chip poster-chip-star">Poster prizes</span>
            <span className="poster-chip poster-chip-mission">Math rewards</span>
            <span className="poster-chip poster-chip-math">{xp} XP banked</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="store-theme-card">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Comet Helmet</p>
          <p className="mt-2 font-bold text-white">Comet Command Deck</p>
          <p className="mt-1 text-sm text-indigo-100/85">Equipping this gives the mission board a pilot/comet feel.</p>
        </article>
        <article className="store-theme-card">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Galaxy Cape</p>
          <p className="mt-2 font-bold text-white">Galaxy Cape Sky</p>
          <p className="mt-1 text-sm text-indigo-100/85">Equipping this turns the mission board into a cosmic poster world.</p>
        </article>
        <article className="store-theme-card">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Turbo Trail</p>
          <p className="mt-2 font-bold text-white">Turbo Trail Arena</p>
          <p className="mt-1 text-sm text-indigo-100/85">Equipping this adds high-speed neon energy to the mission map.</p>
        </article>
      </section>

      <StudentStoreClient
        initialCoins={wallet?.coins ?? 0}
        items={STORE_ITEMS}
        ownedItems={(ownedItems ?? []).map((item) => ({ itemKey: item.item_key as string, isEquipped: Boolean(item.is_equipped) }))}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {AVATAR_LEVELS.map((level) => (
          <article key={level.level} className="level-road-card">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Level {level.level}</p>
            <p className="mt-1 font-bold text-white">{level.title}</p>
            <p className="mt-1 text-sm text-indigo-100/85">Unlocks at {level.minXp} XP</p>
            <p className="mt-2 text-xs font-bold text-amber-300">{xp >= level.minXp ? "Unlocked" : "Locked"}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

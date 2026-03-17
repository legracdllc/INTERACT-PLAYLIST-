"use client";

import { useState, useTransition } from "react";
import {
  AVATAR_LABELS,
  AVATAR_OPTIONS,
  AVATAR_UNLOCKS,
  getAvatarOptionMeta,
  getAvatarLevel,
  isAvatarOptionUnlocked,
  normalizeAvatarForXp,
  type StudentAvatar,
} from "@/lib/avatar";
import { StudentAvatarRenderer } from "@/components/student-avatar-renderer";

function buildPreviewAvatar<K extends keyof StudentAvatar>(
  avatar: StudentAvatar,
  category: K,
  value: StudentAvatar[K],
) {
  return { ...avatar, [category]: value };
}

export function StudentAvatarBuilder({
  initialAvatar,
  playerName,
  xp,
}: {
  initialAvatar: unknown;
  playerName?: string | null;
  xp: number;
}) {
  const [avatar, setAvatar] = useState<StudentAvatar>(() => normalizeAvatarForXp(initialAvatar, xp));
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const level = getAvatarLevel(xp);
  const selectedMeta = {
    base: getAvatarOptionMeta("base", avatar.base),
    hair: getAvatarOptionMeta("hair", avatar.hair),
    outfit: getAvatarOptionMeta("outfit", avatar.outfit),
    shoes: getAvatarOptionMeta("shoes", avatar.shoes),
    weapon: getAvatarOptionMeta("weapon", avatar.weapon),
    companion: getAvatarOptionMeta("companion", avatar.companion),
  };

  function updateAvatar<K extends keyof StudentAvatar>(key: K, value: StudentAvatar[K]) {
    setAvatar((prev) => ({ ...prev, [key]: value }));
  }

  function saveAvatar() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/student/avatar", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatar }),
      });

      const body = (await res.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not save avatar.");
        return;
      }

      setMessage("Avatar saved. Your math hero will follow you across playlists.");
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[340px,1fr]">
      <section className="panel panel-playful avatar-lab-shell p-5">
        <div className="math-corner-doodles" aria-hidden="true" />
        <div className="avatar-lab-sparkles" aria-hidden="true" />
        <p className="poster-ribbon">Avatar Forge</p>
        <h3 className="mt-3 font-display text-2xl font-extrabold text-white">Poster Lion Builder</h3>
        <p className="mt-2 text-sm text-indigo-100/85">Build a lion hero that feels like it came straight out of your math poster world.</p>
        <div className="mt-4 flex justify-center">
          <StudentAvatarRenderer avatar={avatar} size="lg" showLabel name={playerName} xp={xp} />
        </div>
        <div className="poster-chip-row">
          <span className="poster-chip poster-chip-mission">6 custom traits</span>
          <span className="poster-chip poster-chip-star">Level {level.level}: {level.title}</span>
          <span className="poster-chip poster-chip-math">{xp} XP</span>
        </div>
        <div className="avatar-hero-card mt-4">
          <p className="avatar-hero-eyebrow">Hero Profile</p>
          <h4 className="font-display text-xl font-extrabold text-white">{playerName ?? "Math Hero"}</h4>
          <p className="mt-1 text-sm text-cyan-100">Poster Origin: {selectedMeta.outfit.poster}</p>
          <p className="mt-2 text-sm text-indigo-100/85">{selectedMeta.weapon.blurb}</p>
          <div className="avatar-hero-stats mt-4">
            <span className="avatar-stat-pill">{selectedMeta.base.label}</span>
            <span className="avatar-stat-pill">{selectedMeta.hair.vibe}</span>
            <span className="avatar-stat-pill">{selectedMeta.weapon.mathFocus}</span>
            <span className="avatar-stat-pill">{selectedMeta.companion.specialMove}</span>
          </div>
        </div>
        <div className="avatar-loadout mt-4">
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Base</span>
            <span className="avatar-loadout-value">{selectedMeta.base.label}</span>
          </div>
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Mane</span>
            <span className="avatar-loadout-value">{selectedMeta.hair.label}</span>
          </div>
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Suit</span>
            <span className="avatar-loadout-value">{selectedMeta.outfit.label}</span>
          </div>
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Kicks</span>
            <span className="avatar-loadout-value">{selectedMeta.shoes.label}</span>
          </div>
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Tool</span>
            <span className="avatar-loadout-value">{selectedMeta.weapon.label}</span>
          </div>
          <div className="avatar-loadout-item">
            <span className="avatar-loadout-label">Buddy</span>
            <span className="avatar-loadout-value">{selectedMeta.companion.label}</span>
          </div>
        </div>
        {message ? <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
        <button type="button" onClick={saveAvatar} disabled={isPending} className="btn btn-primary mt-4 w-full">
          {isPending ? "Saving Hero..." : "Save Avatar"}
        </button>
      </section>

      <section className="space-y-4">
        {(Object.keys(AVATAR_OPTIONS) as Array<keyof StudentAvatar>).map((category) => (
          <article key={category} className={`panel panel-playful avatar-catalog avatar-catalog-${category} p-5`}>
            <div className="math-corner-doodles" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-xl font-bold">{AVATAR_LABELS[category]}</h3>
                <p className="mt-1 text-sm text-indigo-100/70">
                  {category === "base" ? "Choose the hero body style and pose first. This is what changes the silhouette the most." : null}
                  {category === "hair" ? "Pick a mane style with poster energy." : null}
                  {category === "outfit" ? "Choose the suit that matches your favorite math world." : null}
                  {category === "shoes" ? "Give your hero fun movement and speed." : null}
                  {category === "weapon" ? "Equip a math-powered tool for missions." : null}
                  {category === "companion" ? "Bring a buddy to float beside your lion hero." : null}
                </p>
              </div>
              <span className="poster-chip poster-chip-mission">{AVATAR_OPTIONS[category].length} looks</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {AVATAR_OPTIONS[category].map((option) => {
                const selected = avatar[category] === option;
                const requiredXp = AVATAR_UNLOCKS[category][option];
                const unlocked = isAvatarOptionUnlocked(category, option, xp);
                const meta = getAvatarOptionMeta(category, option);
                const previewAvatar = buildPreviewAvatar(avatar, category, option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (!unlocked) return;
                      updateAvatar(category, option);
                    }}
                    className={selected ? `avatar-choice avatar-choice-${category} avatar-choice-active` : unlocked ? `avatar-choice avatar-choice-${category}` : `avatar-choice avatar-choice-${category} avatar-choice-locked`}
                  >
                    <div className="avatar-choice-topline">
                      <span className="avatar-choice-poster">{meta.poster}</span>
                      <span className={`avatar-rarity-badge avatar-rarity-${meta.rarity.toLowerCase()}`}>{meta.rarity}</span>
                    </div>
                    <div className={`avatar-choice-preview ${category === "base" ? `avatar-base-scene avatar-base-scene-${option}` : ""}`}>
                      {category === "base" ? (
                        <div className="avatar-base-scene-decor" aria-hidden="true">
                          <span className="avatar-base-scene-icon avatar-base-scene-icon-a" />
                          <span className="avatar-base-scene-icon avatar-base-scene-icon-b" />
                          <span className="avatar-base-scene-icon avatar-base-scene-icon-c" />
                        </div>
                      ) : null}
                      <StudentAvatarRenderer avatar={previewAvatar} size="sm" xp={Math.max(xp, requiredXp)} />
                    </div>
                    <span className="avatar-choice-name">{meta.label}</span>
                    <span className="avatar-choice-description">{meta.blurb}</span>
                    <div className="avatar-choice-specs">
                      <span className="avatar-choice-spec">{meta.vibe}</span>
                      <span className="avatar-choice-spec">{meta.mathFocus}</span>
                      <span className="avatar-choice-spec">{meta.specialMove}</span>
                    </div>
                    <span className="avatar-choice-tag">
                      {selected ? "Selected" : unlocked ? "Choose" : `Unlock at ${requiredXp} XP`}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

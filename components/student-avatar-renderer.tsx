import { getAvatarLevel, normalizeAvatar } from "@/lib/avatar";

export function StudentAvatarRenderer({
  avatar,
  size = "md",
  showLabel = false,
  name,
  xp = 0,
}: {
  avatar: unknown;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  name?: string | null;
  xp?: number;
}) {
  const current = normalizeAvatar(avatar);
  const level = getAvatarLevel(xp);

  return (
    <div className={`student-avatar student-avatar-${size} avatar-level-${level.level}`}>
      <div className="student-avatar-stage">
        <div className="student-avatar-stars" />
        <div className={`student-avatar-companion companion-${current.companion}`} />
        <div className="student-avatar-shadow" />
        <div className={`student-avatar-lion lion-base-${current.base} lion-hair-${current.hair} lion-outfit-${current.outfit} lion-shoes-${current.shoes} lion-weapon-${current.weapon}`}>
          <span className="student-avatar-base-aura" />
          <span className="student-avatar-tail" />
          <span className="student-avatar-ears" />
          <span className={`student-avatar-mane hair-${current.hair}`} />
          <div className="student-avatar-head">
            <span className="student-avatar-face-patch" />
            <span className="student-avatar-eye left" />
            <span className="student-avatar-eye right" />
            <span className="student-avatar-nose" />
            <span className="student-avatar-mouth" />
            <span className="student-avatar-cheek left" />
            <span className="student-avatar-cheek right" />
          </div>
          <div className={`student-avatar-outfit outfit-${current.outfit}`}>
            <span className="student-avatar-badge" />
          </div>
          <div className="student-avatar-arms">
            <span className="student-avatar-arm left" />
            <span className="student-avatar-arm right" />
          </div>
          <span className="student-avatar-base-mark" />
          <div className={`student-avatar-shoes shoes-${current.shoes}`} />
          <div className={`student-avatar-weapon weapon-${current.weapon}`} />
        </div>
      </div>
      {showLabel ? <p className="student-avatar-label">{name ?? "Math Hero"} - Lv {level.level}</p> : null}
    </div>
  );
}

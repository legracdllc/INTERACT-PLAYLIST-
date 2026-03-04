type ThemeVariant = "public" | "student" | "teacher";

export function ThemeBackdrop({ variant }: { variant: ThemeVariant }) {
  return (
    <div className={`theme-backdrop theme-backdrop-${variant}`} aria-hidden="true">
      <div className="theme-orb theme-orb-a" />
      <div className="theme-orb theme-orb-b" />
      <div className="theme-orb theme-orb-c" />
      <div className="theme-pattern" />
      <div className="theme-hills" />
    </div>
  );
}

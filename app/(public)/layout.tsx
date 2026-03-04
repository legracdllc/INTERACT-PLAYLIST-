import { ThemeBackdrop } from "@/components/theme-backdrop";
import { LionSurroundings } from "@/components/lion-surroundings";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scene-base scene-public relative min-h-screen overflow-hidden">
      <ThemeBackdrop variant="public" />
      <LionSurroundings />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

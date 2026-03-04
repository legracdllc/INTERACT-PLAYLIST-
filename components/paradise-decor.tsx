type DecorVariant = "public" | "student" | "teacher";

type Sticker = {
  label: string;
  className: string;
};

const stickerSets: Record<DecorVariant, Sticker[]> = {
  public: [
    { label: "🌈", className: "left-3 top-8" },
    { label: "⭐", className: "right-12 top-12" },
    { label: "🧩", className: "left-10 bottom-10" },
    { label: "🧮", className: "right-8 bottom-12" },
    { label: "📐", className: "left-[44%] top-4" },
  ],
  student: [
    { label: "🎮", className: "left-2 top-10" },
    { label: "✨", className: "right-8 top-9" },
    { label: "🦁", className: "left-14 bottom-12" },
    { label: "🏆", className: "right-12 bottom-10" },
    { label: "➕", className: "left-[48%] top-6" },
  ],
  teacher: [
    { label: "📚", className: "left-2 top-8" },
    { label: "✏️", className: "right-10 top-8" },
    { label: "📊", className: "left-12 bottom-10" },
    { label: "🧠", className: "right-10 bottom-10" },
  ],
};

export function ParadiseDecor({ variant = "public" }: { variant?: DecorVariant }) {
  const stickers = stickerSets[variant];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`paradise-glow paradise-glow-${variant}`} />
      {stickers.map((sticker, idx) => (
        <div
          key={`${variant}-${idx}`}
          className={`sticker-card ${sticker.className}`}
          style={{ animationDelay: `${idx * 0.35}s` }}
          aria-hidden="true"
        >
          {sticker.label}
        </div>
      ))}
    </div>
  );
}

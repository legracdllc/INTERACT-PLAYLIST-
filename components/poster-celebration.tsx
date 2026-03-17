"use client";

import type { CSSProperties } from "react";

type PosterCelebrationProps = {
  active?: boolean;
  title?: string;
};

const particles = Array.from({ length: 12 }, (_, index) => index);

export function PosterCelebration({
  active = false,
  title = "Poster Power!",
}: PosterCelebrationProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="poster-celebration" aria-hidden="true">
      <div className="poster-celebration-burst">
        {particles.map((particle) => (
          <span
            key={particle}
            className="poster-particle"
            style={
              {
                "--particle-index": particle,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="poster-cheer-card">
        <span className="poster-cheer-eyes" />
        <strong>{title}</strong>
      </div>
    </div>
  );
}

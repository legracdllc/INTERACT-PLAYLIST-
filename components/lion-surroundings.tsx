"use client";

import Image from "next/image";
import { useState } from "react";

type LionItem = {
  alt: string;
  className: string;
  candidates: string[];
};

const lions: LionItem[] = [
  { alt: "Fraction Paws", className: "lion-pos-1", candidates: ["/mascots/fraction-paws.png"] },
  { alt: "Multiply Mane", className: "lion-pos-2", candidates: ["/mascots/multiply-mane.png"] },
  { alt: "Divide Roar", className: "lion-pos-3", candidates: ["/mascots/divide-roar.png"] },
  { alt: "Geo Cub", className: "lion-pos-4", candidates: ["/mascots/geo-cub.png"] },
  { alt: "Measure King", className: "lion-pos-5", candidates: ["/mascots/measure-king.png"] },
  { alt: "Perimeter Pouncer", className: "lion-pos-6", candidates: ["/mascots/perimeter-pouncer.png"] },
  { alt: "Area Cub", className: "lion-pos-7", candidates: ["/mascots/area-cub.png"] },
  { alt: "Graph Guardian", className: "lion-pos-8", candidates: ["/mascots/graph-guardian.png"] },
  { alt: "Place Value Prince", className: "lion-pos-9", candidates: ["/mascots/place-value-prince.png"] },
  { alt: "Timely Tamer", className: "lion-pos-10", candidates: ["/mascots/timely-tamer.png"] },
];

export function LionSurroundings() {
  const [indexByLion, setIndexByLion] = useState<Record<string, number>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  return (
    <div className="lion-surroundings" aria-hidden="true">
      {lions.map((lion) => {
        if (hidden[lion.className]) return null;
        const idx = indexByLion[lion.className] ?? 0;
        const src = lion.candidates[idx];

        return (
          <div key={lion.className} className={`lion-cutout ${lion.className}`}>
            <Image
              src={src}
              alt={lion.alt}
              fill
              sizes="220px"
              className="object-contain"
              onError={() => {
                const next = idx + 1;
                if (next < lion.candidates.length) {
                  setIndexByLion((prev) => ({ ...prev, [lion.className]: next }));
                } else {
                  setHidden((prev) => ({ ...prev, [lion.className]: true }));
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MascotCard = {
  slug: string;
  name: string;
  concept: string;
  fallback: string;
};

const mascotCards: MascotCard[] = [
  { slug: "fraction-paws", name: "Fraction Paws", concept: "Fractions", fallback: "from-sky-400 to-blue-600" },
  { slug: "multiply-mane", name: "Multiply Mane", concept: "Multiplication", fallback: "from-orange-400 to-red-600" },
  { slug: "divide-roar", name: "Divide Roar", concept: "Division", fallback: "from-rose-400 to-red-600" },
  { slug: "geo-cub", name: "Geo Cub", concept: "Geometry", fallback: "from-emerald-400 to-green-600" },
  { slug: "measure-king", name: "Measure King", concept: "Measurement", fallback: "from-amber-400 to-orange-600" },
  { slug: "perimeter-pouncer", name: "Perimeter Pouncer", concept: "Perimeter", fallback: "from-yellow-400 to-orange-500" },
  { slug: "area-cub", name: "Area Cub", concept: "Area", fallback: "from-lime-400 to-green-600" },
  { slug: "graph-guardian", name: "Graph Guardian", concept: "Graphs", fallback: "from-cyan-400 to-blue-700" },
  { slug: "place-value-prince", name: "Place Value Prince", concept: "Place Value", fallback: "from-red-400 to-rose-600" },
  { slug: "timely-tamer", name: "Timely Tamer", concept: "Telling Time", fallback: "from-blue-400 to-indigo-700" },
];

export function StudentMascotGallery() {
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const cards = useMemo(() => mascotCards, []);

  return (
    <section className="panel mb-6 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold text-white md:text-2xl">Math Mascot Squad</h2>
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Classroom Posters</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const src = `/mascots/${card.slug}.png`;
          const hasImage = !broken[card.slug];

          return (
            <article key={card.slug} className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              <header className="bg-black/25 px-3 py-2 text-center">
                <h3 className="font-display text-base font-extrabold text-white">{card.name}</h3>
              </header>

              <div className={`relative aspect-square bg-gradient-to-br ${card.fallback}`}>
                {hasImage ? (
                  <Image
                    src={src}
                    alt={card.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover"
                    onError={() => setBroken((prev) => ({ ...prev, [card.slug]: true }))}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-sm font-bold text-white">
                    Add `{src}` to show this mascot.
                  </div>
                )}
              </div>

              <footer className="bg-black/25 px-3 py-2 text-center">
                <p className="text-sm font-bold text-cyan-100">{card.concept}</p>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}

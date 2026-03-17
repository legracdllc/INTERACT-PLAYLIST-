"use client";

import { useState, useTransition } from "react";
import type { StoreItem } from "@/lib/store";

type OwnedItem = {
  itemKey: string;
  isEquipped: boolean;
};

export function StudentStoreClient({
  initialCoins,
  items,
  ownedItems,
}: {
  initialCoins: number;
  items: StoreItem[];
  ownedItems: OwnedItem[];
}) {
  const [coins, setCoins] = useState(initialCoins);
  const [inventory, setInventory] = useState<Record<string, OwnedItem>>(
    Object.fromEntries(ownedItems.map((item) => [item.itemKey, item])),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function runAction(action: "purchase" | "equip", itemKey: string, cost = 0) {
    setMessage("");
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/student/store", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, itemKey }),
      });

      const body = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? "Store action failed.");
        return;
      }

      if (action === "purchase") {
        setCoins((prev) => prev - cost);
        setInventory((prev) => ({
          ...prev,
          [itemKey]: { itemKey, isEquipped: false },
        }));
        setMessage("Item purchased.");
      } else {
        setInventory((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (items.find((item) => item.key === key)?.type === items.find((item) => item.key === itemKey)?.type) {
              next[key] = { ...next[key], isEquipped: false };
            }
          }
          next[itemKey] = { ...(next[itemKey] ?? { itemKey }), isEquipped: true };
          return next;
        });
        setMessage("Item equipped.");
      }
    });
  }

  return (
    <div>
      <div className="poster-chip-row">
        <span className="poster-chip poster-chip-math">{coins} coins</span>
      </div>
      {message ? <p className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const owned = inventory[item.key];
          return (
            <article key={item.key} className="store-item-card">
              <div className={`store-item-swatch bg-gradient-to-br ${item.color}`} />
              <div className={`store-board-mockup ${item.missionThemeClass}`}>
                <div className="store-board-theme-label">{item.missionThemeTitle}</div>
                <div className="store-board-scene" aria-hidden="true">
                  <span className="store-scene-icon store-scene-icon-a" />
                  <span className="store-scene-icon store-scene-icon-b" />
                  <span className="store-scene-icon store-scene-icon-c" />
                </div>
                <div className="mission-hud store-board-hud" />
                <div className="mission-map-board store-board-map">
                  <span className="store-board-node store-board-node-a" />
                  <span className="store-board-node store-board-node-b" />
                  <span className="store-board-node store-board-node-c" />
                </div>
              </div>
              <p className="mt-3 font-bold text-white">{item.name}</p>
              <p className="mt-1 text-sm text-indigo-100/85">{item.description}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">When Equipped</p>
              <p className="mt-1 text-sm font-bold text-white">{item.missionThemeTitle}</p>
              <p className="mt-1 text-sm text-indigo-100/78">{item.missionThemeFlavor}</p>
              <p className="text-sm text-amber-300">Cost: {item.cost} coins</p>
              {owned ? (
                <button
                  type="button"
                  disabled={isPending || owned.isEquipped}
                  onClick={() => runAction("equip", item.key)}
                  className="btn mt-3 w-full border border-white/20 bg-white/10 text-white"
                >
                  {owned.isEquipped ? "Equipped" : "Equip"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending || coins < item.cost}
                  onClick={() => runAction("purchase", item.key, item.cost)}
                  className="btn mt-3 w-full border border-white/20 bg-white/10 text-white"
                >
                  Buy
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

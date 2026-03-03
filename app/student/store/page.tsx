export default function StudentStorePage() {
  return (
    <main className="panel p-5">
      <h2 className="font-display text-2xl font-bold">Coin Store</h2>
      <p className="mt-2 text-sm text-slate-600">MVP placeholder: connect this page to avatar cosmetics later.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {["Robot Hat", "Neon Frame", "Trail Effect"].map((item) => (
          <article key={item} className="rounded-xl border border-slate-200 p-3">
            <p className="font-bold">{item}</p>
            <p className="text-sm text-slate-500">Cost: 100 coins</p>
          </article>
        ))}
      </div>
    </main>
  );
}

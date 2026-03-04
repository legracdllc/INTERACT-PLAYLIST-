export default function StudentStorePage() {
  const inventory = [
    { name: "Comet Helmet", cost: 120, color: "from-cyan-300 to-blue-500" },
    { name: "Galaxy Cape", cost: 180, color: "from-fuchsia-300 to-pink-500" },
    { name: "Turbo Trail", cost: 150, color: "from-lime-300 to-emerald-500" },
  ];

  return (
    <main className="panel p-5">
      <h2 className="font-display text-2xl font-bold">Coin Store</h2>
      <p className="mt-1 text-sm text-indigo-100/90">Unlock style items for your avatar and mission board.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {inventory.map((item) => (
          <article key={item.name} className="rounded-xl border border-white/20 bg-black/20 p-3">
            <div className={`h-24 rounded-lg bg-gradient-to-br ${item.color}`} />
            <p className="mt-3 font-bold text-white">{item.name}</p>
            <p className="text-sm text-amber-300">Cost: {item.cost} coins</p>
            <button className="btn mt-3 w-full border border-white/20 bg-white/10 text-white">Preview</button>
          </article>
        ))}
      </div>
    </main>
  );
}

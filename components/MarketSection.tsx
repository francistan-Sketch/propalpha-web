const snapshots = [
  {
    icon: "🏠",
    title: "Rental Yield",
    desc: "Monthly rental transaction data across all districts. Spot high-yield corridors before your clients ask.",
  },
  {
    icon: "🏗️",
    title: "Primary Sales",
    desc: "Developer sales by project and district. Track absorption rates and unsold inventory for new launches.",
  },
  {
    icon: "🔄",
    title: "Resale Market",
    desc: "Resale volume and PSF movements. Identify which projects are gaining or losing momentum.",
  },
  {
    icon: "💎",
    title: "Best Buy · Investment",
    desc: "Algorithmically ranked investment picks based on PSF discount to district average and transaction volume.",
  },
  {
    icon: "🚀",
    title: "New Launch Glance",
    desc: "Latest new launch sales performance at a glance — which projects are selling fast and where.",
  },
];

export default function MarketSection() {
  return (
    <section id="market" className="py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#22c55e" }}
          >
            Market Intelligence
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Always know what the{" "}
            <span style={{
              background: "linear-gradient(135deg,#22c55e,#4ade80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>market is doing</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            Updated monthly from official sources. Available to all users —
            agents and clients alike.
          </p>
        </div>

        {/* 5-card layout: 3 top + 2 bottom centred */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {snapshots.slice(0, 3).map((s) => (
              <SnapCard key={s.title} {...s} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:max-w-2xl sm:mx-auto w-full">
            {snapshots.slice(3).map((s) => (
              <SnapCard key={s.title} {...s} />
            ))}
          </div>
        </div>

        {/* CTA note */}
        <p className="text-center text-sm mt-10" style={{ color: "var(--muted)" }}>
          Market data is available on the app for{" "}
          <span style={{ color: "var(--text)" }}>all registered users</span> — agents and public alike.
        </p>
      </div>
    </section>
  );
}

function SnapCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-3"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <span className="text-2xl">{icon}</span>
      <h3 className="font-bold text-sm">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {desc}
      </p>
    </div>
  );
}

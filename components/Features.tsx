const features = [
  {
    icon: "🔍",
    title: "Transaction Search",
    desc: "Search millions of Singapore property transactions instantly. Filter by district, project name, floor level, category, date range, and PSF. Results load in seconds.",
    tags: ["HDB", "Condo", "Landed", "Commercial"],
  },
  {
    icon: "📊",
    title: "Market Analytics",
    desc: "Deep-dive analytics for any project or district. View average PSF trends, rental yields, transaction volume, and price bands — all on interactive charts.",
    tags: ["PSF Trends", "Rental Yield", "Volume"],
  },
  {
    icon: "🏢",
    title: "New Launch Intelligence",
    desc: "Explore new launch projects with tower-level floor plans. See sold units, available stacks, average PSF per block, and full transaction history for every unit.",
    tags: ["Tower View", "Stack Analysis", "Unit History"],
  },
  {
    icon: "🗺️",
    title: "Map View",
    desc: "Interactive map showing all projects across Singapore. Tap any project for instant PSF data and find comparable developments nearby with one click.",
    tags: ["Heatmap", "Comparables", "District Filter"],
  },
  {
    icon: "📈",
    title: "Market Updates",
    desc: "Stay ahead with curated weekly market snapshots — rental yields, primary sales, resale activity, best buy picks, and new launch summaries all in one view.",
    tags: ["Rental", "Resale", "Primary Sales"],
  },
  {
    icon: "🧮",
    title: "Buyer Calculator",
    desc: "Calculate BSD, ABSD, and total cash outlay for any property. Factor in loan eligibility, MSR/TDSR limits, and show clients a clear affordability breakdown.",
    tags: ["BSD", "ABSD", "TDSR/MSR"],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            Core Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything an agent needs,{" "}
            <span className="gradient-text">in one platform</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            PropAlpha consolidates data from multiple official sources into a
            single, fast, mobile-first experience.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border flex flex-col gap-4 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                transitionDuration: "200ms",
              }}
            >
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {f.desc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                      backgroundColor: "var(--surface2)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

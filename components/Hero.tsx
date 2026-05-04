export default function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-5 overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 10%, rgba(79,142,247,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(124,92,252,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
        style={{
          backgroundColor: "rgba(79,142,247,0.1)",
          borderColor: "rgba(79,142,247,0.3)",
          color: "#4f8ef7",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Built for Singapore Real Estate Professionals
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl mb-6">
        Singapore Property Intelligence,{" "}
        <span className="gradient-text">All in One App</span>
      </h1>

      {/* Subheadline */}
      <p
        className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-10"
        style={{ color: "var(--muted)" }}
      >
        PropAlpha gives real estate agents the edge — live transaction data,
        market analytics, tenancy document generation, and room inventory
        reports, all from your phone.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <a
          href="#download"
          className="px-8 py-3.5 rounded-full font-semibold text-sm text-white transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)" }}
        >
          Download Free
        </a>
        <a
          href="#features"
          className="px-8 py-3.5 rounded-full font-semibold text-sm border transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            backgroundColor: "var(--surface)",
          }}
        >
          See Features →
        </a>
      </div>

      {/* Stats bar */}
      <div
        className="flex flex-wrap justify-center gap-8 sm:gap-14 pt-8 border-t w-full max-w-xl"
        style={{ borderColor: "var(--border)" }}
      >
        {[
          { value: "1M+", label: "Transactions" },
          { value: "28", label: "Districts" },
          { value: "10+", label: "Tools" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="text-2xl font-bold gradient-text">{s.value}</span>
            <span className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Download the app",
    desc: "Available on iOS and Android. Register with your email in under a minute.",
  },
  {
    num: "02",
    title: "Search & explore",
    desc: "Access Singapore transaction data, market snapshots, and new launch intelligence immediately after signing up.",
  },
  {
    num: "03",
    title: "Unlock agent tools",
    desc: "Contact Luminaire Proptech to activate your Tech Tools — LOI, TA, Room Inventory, and Buyer Calculator.",
  },
  {
    num: "04",
    title: "Close deals faster",
    desc: "Generate documents, manage tenancies, and deliver professional reports — all from your phone, on the go.",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="py-24 px-5"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            Getting Started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Up and running in{" "}
            <span className="gradient-text">minutes</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col gap-4 relative">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-5 left-12 right-0 h-px"
                  style={{ backgroundColor: "var(--border)" }}
                />
              )}

              {/* Number badge */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border relative z-10"
                style={{
                  background: "linear-gradient(135deg,rgba(79,142,247,0.2),rgba(124,92,252,0.2))",
                  borderColor: "rgba(79,142,247,0.4)",
                  color: "#4f8ef7",
                }}
              >
                {s.num}
              </div>

              <div>
                <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

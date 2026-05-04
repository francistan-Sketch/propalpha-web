const tools = [
  {
    icon: "📝",
    color: "#22c55e",
    title: "Letter of Intent",
    desc: "Generate a complete, professionally formatted LOI PDF in seconds. Auto-fills from your tenancy data — landlord, tenant, rental terms, deposit schedule, and special clauses.",
    bullets: ["Landlord & tenant details", "Rent & deposit terms", "Option to renew clause", "Share via WhatsApp / email"],
  },
  {
    icon: "📋",
    color: "#4f8ef7",
    title: "Tenancy Agreement",
    desc: "Full Singapore-standard TA with all standard covenants, diplomatic clause, DIP rider, and special conditions. Fields auto-saved between sessions.",
    bullets: ["All standard covenants", "Diplomatic clause toggle", "Bank transfer details", "Witness signature blocks"],
  },
  {
    icon: "📸",
    color: "#a78bfa",
    title: "Room Inventory",
    desc: "Create move-in and move-out inspection reports with photos. Pre-loaded Singapore apartment templates, condition ratings per item, and a professional PDF output.",
    bullets: ["Camera & gallery upload", "Room templates (Condo/HDB)", "Condition ratings", "Embedded photo PDF report"],
  },
  {
    icon: "🔍",
    color: "#f59e0b",
    title: "AML Checks",
    desc: "Anti-money laundering compliance checklist built to CEA requirements. Document your due diligence for every transaction.",
    bullets: ["CEA-aligned workflow", "Client verification", "Document log", "Coming soon"],
    soon: true,
  },
];

export default function AgentTools() {
  return (
    <section
      id="tools"
      className="py-24 px-5"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#a78bfa" }}
          >
            Tech Tools
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Professional tools that{" "}
            <span style={{
              background: "linear-gradient(135deg,#a78bfa,#7c5cfc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>save you hours</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            From LOI to move-out inventory, PropAlpha handles the paperwork
            so you can focus on closing deals.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl p-7 border relative overflow-hidden"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
            >
              {/* Glow accent */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ backgroundColor: t.color, transform: "translate(30%,-30%)" }}
              />

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: t.color + "22" }}
                  >
                    {t.icon}
                  </span>
                  <h3 className="font-bold text-base">{t.title}</h3>
                </div>
                {t.soon && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "#f59e0b22", color: "#f59e0b" }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--muted)" }}>
                {t.desc}
              </p>

              <ul className="grid grid-cols-2 gap-2">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span style={{ color: t.color }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

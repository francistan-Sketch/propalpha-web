export default function Download() {
  return (
    <section id="download" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(79,142,247,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
              style={{
                backgroundColor: "rgba(79,142,247,0.1)",
                borderColor: "rgba(79,142,247,0.3)",
                color: "#4f8ef7",
              }}
            >
              Free to download
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start using PropAlpha today
            </h2>
            <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
              Available on iOS and Android. Market data is free for all users.
              Tech Tools require agent activation.
            </p>

            {/* Store buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="https://apps.apple.com/app/propalpha/id0000000000"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-semibold text-sm transition-colors hover:border-white/30"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-70">Download on the</div>
                  <div>App Store</div>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=sg.propalpha.app"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-semibold text-sm transition-colors hover:border-white/30"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.2.96.09l11.99-6.99-2.54-2.54-10.41 9.44zM.93 1.4A1.82 1.82 0 0 0 .5 2.67v18.66c0 .5.16.94.43 1.27l.07.07 10.46-10.46v-.25L.93 1.4zm18.33 8.26-2.85-1.66-2.85 2.85 2.85 2.85 2.86-1.66c.82-.47.82-1.24-.01-1.38zM3.18.24l10.4 10.41 2.54-2.54L4.14.12C3.82 0 3.48.04 3.18.24z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-70">Get it on</div>
                  <div>Google Play</div>
                </div>
              </a>
            </div>

            {/* Features included */}
            <div
              className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm"
              style={{ color: "var(--muted)" }}
            >
              {[
                "✓  Free market data",
                "✓  Transaction search",
                "✓  New launch explorer",
                "✓  Map view",
              ].map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

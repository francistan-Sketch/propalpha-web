export default function Footer() {
  return (
    <footer
      className="border-t py-10 px-5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-2 font-bold text-base">
            <span className="text-xl">α</span>
            <span className="gradient-text">PropAlpha</span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            by Luminaire Proptech
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-xs" style={{ color: "var(--muted)" }}>
          <a href="mailto:contact@luminaireproptech.com.sg" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#download" className="hover:text-white transition-colors">
            Download
          </a>
        </div>

        {/* Legal */}
        <p className="text-xs text-center sm:text-right" style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} Luminaire Proptech. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

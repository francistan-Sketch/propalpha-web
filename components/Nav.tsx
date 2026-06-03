"use client";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#tools", label: "Agent Tools" },
    { href: "#market", label: "Market Data" },
    { href: "#download", label: "Download" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(6,6,18,0.85)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-2xl">α</span>
          <span className="gradient-text">PropAlpha</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Sign In
          </a>
          <a
            href="#download"
            className="text-sm font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)", color: "#fff" }}
          >
            Get the App
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-5 h-0.5 rounded"
              style={{ backgroundColor: "var(--text)" }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-5 py-4 flex flex-col gap-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm"
              style={{ color: "var(--muted)" }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-full text-center"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
            onClick={() => setOpen(false)}
          >
            Sign In
          </a>
        </div>
      )}
    </nav>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  images: { qualities: [75, 82], formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        // Allow Google sign-in popup to communicate back on all pages
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import PaBackground from "@/components/site/PaBackground";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://propalpha.tech"),
  title: "PropAlpha — No more searching. Just say what you mean.",
  description:
    "Ask AI Socrates about Singapore property in plain English and get tables, charts and tower views, built from PropAlpha's own transaction database. Flyer Maker, Income Valuation, calculators, market data and maps for agents.",
  keywords:
    "Singapore property, real estate agent, AI property assistant, property transactions, psf, flyer maker, income valuation, market analytics, PropAlpha",
  openGraph: {
    title: "PropAlpha — No more searching. Just say what you mean.",
    description: "Singapore property analytics, rebuilt from the ground up as an API, with AI Socrates on top.",
    url: "https://propalpha.tech",
    siteName: "PropAlpha",
    locale: "en_SG",
    type: "website",
    images: [{ url: "/site/shots/ipad13-02.png", width: 2064, height: 2752, alt: "AI Socrates answers with an interactive tower view" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0920" },
    { media: "(prefers-color-scheme: light)", color: "#F4F0FA" },
  ],
};

// Applies the stored theme before first paint so there is no flash. Dark is the default.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('pa-theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${archivo.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PaBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

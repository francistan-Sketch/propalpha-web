import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropAlpha — Singapore Property Intelligence",
  description: "The professional platform for Singapore real estate agents. Search transactions, analyse markets, generate LOI & TA, manage tenancies, and run room inventory reports — all in one app.",
  keywords: "Singapore property, real estate agent, property transactions, tenancy agreement, LOI, market analytics, PropAlpha",
  openGraph: {
    title: "PropAlpha — Singapore Property Intelligence",
    description: "Professional property tools for Singapore real estate agents.",
    url: "https://propalpha.tech",
    siteName: "PropAlpha",
    locale: "en_SG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

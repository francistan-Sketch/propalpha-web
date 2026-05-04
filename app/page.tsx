import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AgentTools from "@/components/AgentTools";
import MarketSection from "@/components/MarketSection";
import HowItWorks from "@/components/HowItWorks";
import Download from "@/components/Download";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Nav />
      <Hero />
      <Features />
      <AgentTools />
      <MarketSection />
      <HowItWorks />
      <Download />
      <Footer />
    </main>
  );
}

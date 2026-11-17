import { Pricing } from "@/features/landing/components/pricing-section";
import { Footer, Hero, HowItWorks, LevelsShowcase, PrivacyNote } from "@/features/landing/components/landing-sections";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <Hero />
      <main>
        <HowItWorks />
        <LevelsShowcase />
        <Pricing />
        <PrivacyNote />
      </main>
      <Footer />
    </div>
  );
}

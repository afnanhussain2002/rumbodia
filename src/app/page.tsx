import { BackgroundBlobs } from "@/components/fun/decor";
import { BlackFridayBar } from "@/features/billing/components/plan-cards";
import { Pricing } from "@/features/landing/components/pricing-section";
import {
  DemoSection,
  FaqSection,
  Footer,
  Hero,
  HowItWorks,
  LevelsShowcase,
  PrivacyNote,
  StatsPreview,
} from "@/features/landing/components/landing-sections";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <BackgroundBlobs />
      <BlackFridayBar />
      <Hero />
      <main>
        <DemoSection />
        <LevelsShowcase />
        <HowItWorks />
        <StatsPreview />
        <Pricing />
        <FaqSection />
        <PrivacyNote />
      </main>
      <Footer />
    </div>
  );
}

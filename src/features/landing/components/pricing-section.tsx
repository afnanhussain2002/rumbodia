import { TRIAL_DAYS } from "@/lib/billing";
import { Hl } from "@/components/fun/ink-hero";
import { PlanCards, PromoBanner } from "@/features/billing/components/plan-cards";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="mx-auto w-full max-w-[1180px] scroll-mt-6 px-4 py-14 sm:px-6 lg:px-8">
      <h2 id="pricing-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
        Simple <Hl marker>pricing</Hl>
      </h2>
      <p className="mt-3 max-w-xl text-[17px] text-ink-soft">Try everything free for {TRIAL_DAYS} days. No card needed to start.</p>
      <PromoBanner className="mt-8" />
      <div className="mt-10">
        <PlanCards />
      </div>
    </section>
  );
}

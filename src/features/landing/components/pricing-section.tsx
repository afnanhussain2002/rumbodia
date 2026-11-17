import { TRIAL_DAYS } from "@/lib/billing";
import { PlanCards, PromoBanner } from "@/features/billing/components/plan-cards";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="mx-auto w-full max-w-[1100px] px-4 py-14 sm:px-6 lg:px-8">
      <h2 id="pricing-title" className="font-display text-3xl font-bold tracking-[-0.01em]">
        Pricing
      </h2>
      <p className="mt-2 max-w-xl text-ink-soft">Try everything free for {TRIAL_DAYS} days. No card needed to start.</p>
      <PromoBanner className="mt-6" />
      <div className="mt-8">
        <PlanCards />
      </div>
    </section>
  );
}

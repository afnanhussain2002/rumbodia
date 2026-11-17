"use client";

import Link from "next/link";
import { Check, Tag } from "lucide-react";
import { PLAN_ORDER, PLANS, PROMO, promoIsLive, promoPrice, type PlanId } from "@/lib/billing";
import { cn } from "@/lib/utils/cn";
import { Button, buttonClass } from "@/components/ui/button";

const FEATURES = ["Unlimited daily updates scored by Gemini", "Weekly insights", "Stats, calendar and full history", "Export anytime"];

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

interface PlanCardsProps {
  /** Logged-in mode: a button per plan. Omit for the landing page, where each card links to sign-up. */
  onPick?: (plan: PlanId) => void;
  busyPlan?: PlanId | null;
  currentPlan?: PlanId | null;
  /** Subscription plans can't be bought again while one is active. */
  hasActivePlan?: boolean;
}

export function PromoBanner({ className }: { className?: string }) {
  if (!promoIsLive()) return null;
  const ends = new Date(PROMO.endsAt).toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return (
    <div className={cn("flex items-start gap-3 rounded-[16px] bg-brand-soft p-4 text-[15px]", className)}>
      <Tag size={20} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
      <p>
        <strong>Black Friday:</strong> enter code <code className="rounded-md bg-card px-1.5 py-0.5 font-bold">{PROMO.code}</code> at
        checkout for {PROMO.percentOff}% off. On Monthly and Yearly you keep the discount for as long as you stay subscribed. Ends {ends}.
      </p>
    </div>
  );
}

export function PlanCards({ onPick, busyPlan, currentPlan, hasActivePlan }: PlanCardsProps) {
  const promo = promoIsLive();
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const featured = id === "yearly";
        const isCurrent = currentPlan === id;
        const blocked = currentPlan === "lifetime" || (plan.recurring && hasActivePlan);
        return (
          <li
            key={id}
            className={cn("surface relative flex flex-col p-6", featured && "ring-2 ring-brand")}
            aria-label={`${plan.name} plan`}
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[12px] font-bold text-on-brand">
                Best value
              </span>
            )}
            <h3 className="font-display text-xl font-bold">{plan.name}</h3>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold tabular">{money(plan.price)}</span>
              <span className="text-ink-soft">{plan.per}</span>
            </p>
            {promo && (
              <p className="mt-1 text-[14px] font-semibold text-brand-strong">
                {money(promoPrice(plan.price))} {plan.per} with {PROMO.code}
              </p>
            )}
            <p className="mt-2 text-[14px] text-ink-soft">{plan.blurb}</p>
            <ul className="mt-5 space-y-2 text-[14px]">
              {FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check size={18} className="shrink-0 text-brand-strong" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex-1" />
            {onPick ? (
              <Button
                variant={featured ? "primary" : "secondary"}
                className="w-full"
                loading={busyPlan === id}
                disabled={Boolean(busyPlan) || blocked}
                onClick={() => onPick(id)}
              >
                {isCurrent ? "Your plan" : id === "lifetime" ? "Buy lifetime" : `Choose ${plan.name.toLowerCase()}`}
              </Button>
            ) : (
              <Link href="/sign-up" className={buttonClass(featured ? "primary" : "secondary", "md", "w-full")}>
                {plan.recurring ? "Start 7-day free trial" : "Get lifetime"}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

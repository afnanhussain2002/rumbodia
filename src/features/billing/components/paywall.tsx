"use client";

import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/billing";
import { buttonClass } from "@/components/ui/button";
import { daysLeft, useBilling } from "@/features/billing/hooks/use-billing";

/** Pages that stay open after the trial: billing itself, plus settings and data export. */
const ALWAYS_OPEN = ["/app/billing", "/app/more", "/app/more/settings", "/app/more/data"];

export function isPaywalled(pathname: string): boolean {
  return !ALWAYS_OPEN.includes(pathname);
}

/** Replaces the page once the trial is over. */
export function Paywall() {
  return (
    <section aria-labelledby="paywall-title" className="mx-auto max-w-[520px] py-10 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
        <Sparkles size={26} aria-hidden />
      </span>
      <h2 id="paywall-title" className="mt-5 font-display text-2xl font-bold">
        Your {TRIAL_DAYS}-day free trial has ended
      </h2>
      <p className="mt-2 text-ink-soft">
        Keep logging your days and getting scores and weekly insights. Plans start at $10 a month. Your log is saved and waiting.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/app/billing" className={buttonClass("primary", "lg")}>
          See plans
        </Link>
        <Link href="/app/more/data" className={buttonClass("secondary", "lg")}>
          Export my data
        </Link>
      </div>
    </section>
  );
}

/** A slim reminder during the trial's last days. */
export function TrialBanner() {
  const { data } = useBilling();
  if (data?.state !== "trial") return null;
  const d = daysLeft(data.trialEndsAt);
  if (d > 3) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-brand-soft px-4 py-3 text-[15px]">
      <span className="inline-flex items-center gap-2">
        <Clock size={18} className="text-brand-strong" aria-hidden />
        {d === 0 ? "Your free trial ends today." : `${d} day${d === 1 ? "" : "s"} left in your free trial.`}
      </span>
      <Link href="/app/billing" className={buttonClass("primary", "sm")}>
        Choose a plan
      </Link>
    </div>
  );
}

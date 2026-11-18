"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Hl, InkHero } from "@/components/fun/ink-hero";
import { Squiggle } from "@/components/fun/decor";
import { daysLeft, useBilling } from "@/features/billing/hooks/use-billing";

/** Pages that stay open after the trial: billing itself, plus settings and data export. */
const ALWAYS_OPEN = ["/app/billing", "/app/more", "/app/more/settings", "/app/more/data", "/app/admin"];

export function isPaywalled(pathname: string): boolean {
  return !ALWAYS_OPEN.includes(pathname);
}

/** Replaces the page once the trial is over. */
export function Paywall() {
  return (
    <InkHero level="steady" bubble="I miss you already!" mascotSize={280} className="min-h-[440px]">
      <h2 id="paywall-title" className="font-display text-[clamp(40px,6vw,64px)] leading-[0.95] font-extrabold tracking-[-0.02em] uppercase">
        Your free week&rsquo;s <Hl>up!</Hl>
        <br />
        Keep your <Hl>rumbo</Hl> going.
      </h2>
      <Squiggle className="mt-4" width={140} />
      <p className="mt-5 max-w-md text-[17px] text-cream/75">
        Keep logging, getting scores and weekly reads. Plans start at $10 a month. Your log is saved and waiting for you.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app/billing" className={buttonClass("primary", "lg", "btn-pop !border-cream")}>
          See plans
        </Link>
        <Link href="/app/more/data" className={buttonClass("ghost", "lg", "text-cream hover:bg-white/10")}>
          Export my data
        </Link>
      </div>
    </InkHero>
  );
}

/** A friendly reminder during the trial's last days. */
export function TrialBanner() {
  const { data } = useBilling();
  if (data?.state !== "trial") return null;
  const d = daysLeft(data.trialEndsAt);
  if (d > 3) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-2 border-outline bg-bubble px-4 py-3 text-[15px] shadow-[var(--shadow-pop-sm)]">
      <span className="inline-flex items-center gap-2 font-semibold">
        <Clock size={18} className="text-mood-strong" aria-hidden />
        {d === 0 ? "Last day of your free trial. Let's keep going?" : `${d} day${d === 1 ? "" : "s"} left with me. Let's keep going?`}
      </span>
      <Link href="/app/billing" className={buttonClass("primary", "sm")}>
        Choose a plan
      </Link>
    </div>
  );
}

/** Sidebar pill: "4 days left" during the trial. */
export function TrialPill() {
  const { data } = useBilling();
  if (data?.state !== "trial") return null;
  const d = daysLeft(data.trialEndsAt);
  return (
    <Link
      href="/app/billing"
      title={`${d} day${d === 1 ? "" : "s"} left in your free trial`}
      className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-mood-500 bg-mood-50 px-2 py-1.5 text-[13px] font-bold text-mood-strong hover:bg-mood-100 lg:justify-start lg:px-3"
    >
      <Clock size={15} aria-hidden className="shrink-0" />
      <span className="tabular">
        {d}
        <span className="hidden lg:inline"> day{d === 1 ? "" : "s"} left · trial</span>
        <span className="lg:hidden">d</span>
      </span>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { PLAN_ORDER, PLANS, PROMO, promoIsLive, promoPrice, type PlanId } from "@/lib/billing";
import { cn } from "@/lib/utils/cn";
import { Button, buttonClass } from "@/components/ui/button";
import { Sticker } from "@/components/fun/decor";
import { Rumbo } from "@/features/mascot/rumbo";

const FEATURES = ["Unlimited daily updates scored by AI", "Weekly insights", "Stats, calendar and full history", "Export anytime"];

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

interface PlanCardsProps {
  /** Logged-in mode: a button per plan. Omit for the landing page, where each card links to sign-up. */
  onPick?: (plan: PlanId) => void;
  busyPlan?: PlanId | null;
  currentPlan?: PlanId | null;
  /** Subscription plans can't be bought again while one is active. */
  hasActivePlan?: boolean;
}

const DISMISS_KEY = "rumbodia:bf-dismissed";

/** Ticks every second in the browser; null on the server (so the countdown never mismatches during hydration). */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
}

/** Live "ends in" text. Renders nothing after the deadline. */
function Countdown({ className }: { className?: string }) {
  const now = useNow();
  if (now === null) return <span className={className}>&nbsp;</span>;
  const left = Date.parse(PROMO.endsAt) - now;
  if (left <= 0) return null;
  return (
    <span className={cn("tabular", className)} role="timer" aria-live="off">
      Ends in {countdown(left)}
    </span>
  );
}

/** Black Friday details card with a live countdown (billing page, pricing section). Hides itself after the deadline. */
export function PromoBanner({ className }: { className?: string }) {
  const now = useNow();
  if (!promoIsLive(now ?? undefined)) return null;
  return (
    <div className={cn("ink-hero flex flex-col gap-4 !rounded-[24px] p-5 sm:flex-row sm:items-center sm:p-6", className)}>
      <Sticker className="self-start text-[18px] sm:self-center" rotate={-5}>
        Black Friday
      </Sticker>
      <p className="min-w-0 flex-1 text-[15px] text-cream/85">
        <strong className="text-cream">{PROMO.percentOff}% off</strong> with code{" "}
        <code className="rounded-md bg-mood-500 px-1.5 py-0.5 font-bold text-mood-ink">{PROMO.code}</code> at checkout. On Monthly and Yearly you
        keep the discount for as long as you stay subscribed.
      </p>
      <Countdown className="shrink-0 font-hand text-[20px] text-mood-500" />
    </div>
  );
}

/** Slim, dismissible top bar with the countdown (landing page). Gone after the deadline. */
export function BlackFridayBar() {
  const now = useNow();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === PROMO.code) setDismissed(true);
    } catch {
      /* storage blocked: the bar just shows */
    }
  }, []);
  if (now === null || dismissed || !promoIsLive(now)) return null;
  return (
    <div className="relative z-40 bg-ink-fixed text-cream">
      <div className="mx-auto flex min-h-11 max-w-[1100px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-12 py-2 text-center text-[14px] font-semibold sm:px-6">
        <span>
          🖤 Black Friday: <span className="text-mood-500">{PROMO.percentOff}% off</span> with code{" "}
          <code className="rounded-md bg-mood-500 px-1.5 py-0.5 font-bold text-mood-ink">{PROMO.code}</code>
        </span>
        <Countdown className="font-hand text-[18px] text-mood-500" />
      </div>
      <button
        type="button"
        aria-label="Dismiss Black Friday banner"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(DISMISS_KEY, PROMO.code);
          } catch {
            /* ignore */
          }
        }}
        className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-cream/70 hover:bg-white/10 hover:text-cream"
      >
        <X size={16} aria-hidden />
      </button>
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
            className={cn("surface lift relative flex flex-col p-6", featured && "border-2! border-outline! shadow-[var(--shadow-pop)]!")}
            aria-label={`${plan.name} plan`}
          >
            {featured && !isCurrent && (
              <Sticker className="absolute -top-4 right-5 text-[15px]" rotate={5}>
                Best value
              </Sticker>
            )}
            {isCurrent && (
              <span className="absolute -top-5 right-4 inline-flex items-center gap-1">
                <Sticker tone="cream" className="text-[14px]" rotate={-4}>
                  You&rsquo;re here
                </Sticker>
                <Rumbo level="soaring" size={40} limbs={false} decorative />
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

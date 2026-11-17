import { TRIAL_DAYS, type BillingStatus } from "@/lib/billing";
import type { BillingDoc } from "@/server/repositories/billing-repository";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Subscription states that keep the app unlocked. past_due = card failed, Stripe is retrying. */
export const ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

export const trialEnd = (doc: Pick<BillingDoc, "trialStartedAt">) => Date.parse(doc.trialStartedAt) + TRIAL_DAYS * DAY_MS;

/** Lifetime beats everything, then a live subscription, then the free trial. */
export function toStatus(doc: BillingDoc, now = Date.now()): BillingStatus {
  const base = {
    trialEndsAt: new Date(trialEnd(doc)).toISOString(),
    currentPeriodEnd: doc.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(doc.cancelAtPeriodEnd),
    pastDue: doc.status === "past_due",
    canManage: Boolean(doc.stripeCustomerId),
  };
  if (doc.lifetimePaidAt) return { ...base, state: "active", plan: "lifetime", currentPeriodEnd: null, pastDue: false };
  if (doc.plan && doc.status && ACCESS_STATUSES.has(doc.status)) return { ...base, state: "active", plan: doc.plan };
  return { ...base, state: now < trialEnd(doc) ? "trial" : "expired", plan: null };
}

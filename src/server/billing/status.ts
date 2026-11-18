import { TRIAL_DAYS, type BillingStatus, type PlanId } from "@/lib/billing";
import type { BillingDoc } from "@/server/repositories/billing-repository";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Subscription states that keep the app unlocked. past_due = card failed, Stripe is retrying. */
export const ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

export const trialEnd = (doc: Pick<BillingDoc, "trialStartedAt" | "trialExtraDays">) =>
  Date.parse(doc.trialStartedAt) + (TRIAL_DAYS + Math.max(0, doc.trialExtraDays ?? 0)) * DAY_MS;

/** An admin grant that is still running. */
export function activeGrant(doc: BillingDoc, now = Date.now()): { plan: PlanId; until: string | null } | null {
  if (!doc.grantPlan) return null;
  if (doc.grantUntil && Date.parse(doc.grantUntil) <= now) return null;
  return { plan: doc.grantPlan, until: doc.grantUntil ?? null };
}

/** Lifetime beats everything, then a live subscription, then an admin grant, then the free trial. */
export function toStatus(doc: BillingDoc, now = Date.now()): BillingStatus {
  const base = {
    trialEndsAt: new Date(trialEnd(doc)).toISOString(),
    currentPeriodEnd: doc.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(doc.cancelAtPeriodEnd),
    pastDue: doc.status === "past_due",
    canManage: Boolean(doc.stripeCustomerId),
    granted: false,
  };
  if (doc.lifetimePaidAt) return { ...base, state: "active", plan: "lifetime", currentPeriodEnd: null, pastDue: false };
  if (doc.plan && doc.status && ACCESS_STATUSES.has(doc.status)) return { ...base, state: "active", plan: doc.plan };
  const grant = activeGrant(doc, now);
  if (grant) {
    return { ...base, state: "active", plan: grant.plan, currentPeriodEnd: grant.until, cancelAtPeriodEnd: false, pastDue: false, granted: true };
  }
  return { ...base, state: now < trialEnd(doc) ? "trial" : "expired", plan: null };
}

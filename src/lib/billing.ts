/** Plans and trial rules. Shared by the server and the pricing UI, so it must stay free of secrets. */

export const TRIAL_DAYS = 7;

export type PlanId = "monthly" | "yearly" | "lifetime";

export interface PlanInfo {
  id: PlanId;
  name: string;
  /** Price in US dollars. */
  price: number;
  /** Shown after the price, for example "/month". */
  per: string;
  blurb: string;
  /** Stripe price lookup key, created by scripts/stripe-setup.mjs. */
  lookupKey: string;
  recurring: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    price: 10,
    per: "/month",
    blurb: "Cancel anytime.",
    lookupKey: "rumbodia_monthly",
    recurring: true,
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    price: 99,
    per: "/year",
    blurb: "About 2 months free. $8.25 a month.",
    lookupKey: "rumbodia_yearly",
    recurring: true,
  },
  lifetime: {
    id: "lifetime",
    name: "Lifetime",
    price: 249,
    per: "once",
    blurb: "Pay once, keep it forever.",
    lookupKey: "rumbodia_lifetime",
    recurring: false,
  },
};

export const PLAN_ORDER: PlanId[] = ["monthly", "yearly", "lifetime"];

export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === "string" && (PLAN_ORDER as string[]).includes(value);

/** The Black Friday code: 60% off, kept for as long as the subscription lasts. */
export const PROMO = {
  code: "BLACKFRIDAY",
  percentOff: 60,
  /** Last moment the code can be entered. Must match REDEEM_BY in scripts/stripe-setup.mjs. */
  endsAt: "2026-12-02T23:59:59Z",
};

export const promoIsLive = (now = Date.now()) => now <= Date.parse(PROMO.endsAt);

export const promoPrice = (price: number) => Math.round(price * (1 - PROMO.percentOff / 100) * 100) / 100;

/** What the app shows about the signed-in user's access. */
export interface BillingStatus {
  /** `trial`: inside the free 7 days. `active`: paid. `expired`: trial over and nothing paid. */
  state: "trial" | "active" | "expired";
  plan: PlanId | null;
  trialEndsAt: string;
  /** For subscriptions: when the current paid period ends (renews or stops). */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Payment failed and Stripe is retrying. Access continues meanwhile. */
  pastDue: boolean;
  /** The user has a Stripe customer, so the billing portal is available. */
  canManage: boolean;
}

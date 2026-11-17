import "server-only";
import Stripe from "stripe";
import { PLANS, type PlanId } from "@/lib/billing";
import { AppError } from "@/server/http";

const globalForStripe = globalThis as unknown as { __rumbodiaStripe?: Stripe };

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new AppError("Payments are not set up yet (STRIPE_SECRET_KEY is missing).", 500, "missing_stripe_key");
  globalForStripe.__rumbodiaStripe ??= new Stripe(key);
  return globalForStripe.__rumbodiaStripe;
}

/** Stripe price ids, looked up once per process by the lookup keys that scripts/stripe-setup.mjs creates. */
let priceIds: Promise<Map<string, PlanId>> | undefined;

async function loadPrices(): Promise<Map<string, PlanId>> {
  const plans = Object.values(PLANS);
  const list = await getStripe().prices.list({ lookup_keys: plans.map((p) => p.lookupKey), active: true, limit: 10 });
  const map = new Map<string, PlanId>();
  for (const price of list.data) {
    const plan = plans.find((p) => p.lookupKey === price.lookup_key);
    if (plan) map.set(price.id, plan.id);
  }
  return map;
}

function prices(): Promise<Map<string, PlanId>> {
  priceIds ??= loadPrices().catch((err) => {
    priceIds = undefined;
    throw err;
  });
  return priceIds;
}

export async function priceIdFor(plan: PlanId): Promise<string> {
  for (const [id, p] of await prices()) if (p === plan) return id;
  throw new AppError("This plan is not available right now. Run npm run stripe:setup.", 500, "missing_price");
}

export async function planForPrice(priceId: string | undefined): Promise<PlanId | null> {
  if (!priceId) return null;
  return (await prices()).get(priceId) ?? null;
}

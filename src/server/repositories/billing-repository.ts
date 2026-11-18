import "server-only";
import { collection } from "@/server/db/mongo";
import type { PlanId } from "@/lib/billing";

/**
 * One document per user; `_id` is the Clerk user id.
 * Kept apart from entries/settings so "Delete all data" never resets a trial or a purchase.
 */
export interface BillingDoc {
  _id: string;
  /** Start of the free trial: when the Clerk account was created. */
  trialStartedAt: string;
  stripeCustomerId?: string;
  /** Paid plan, or null when nothing is paid. */
  plan: PlanId | null;
  /** Stripe subscription status (active, trialing, past_due, canceled, ...) or "paid" for lifetime. */
  status: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  /** Set once a lifetime payment succeeds. Wins over any subscription. */
  lifetimePaidAt?: string | null;
  lastSyncedAt?: string;
  /**
   * Access given by an admin, without Stripe. Kept apart from `plan`/`status` because a Stripe sync
   * overwrites those. `grantUntil` null = forever.
   */
  grantPlan?: PlanId | null;
  grantUntil?: string | null;
  grantedBy?: string | null;
  grantedAt?: string | null;
  /** Extra free-trial days added by an admin. */
  trialExtraDays?: number;
}

const billing = () => collection<BillingDoc>("billing");

export const billingRepository = {
  async get(userId: string): Promise<BillingDoc | null> {
    return (await billing()).findOne({ _id: userId });
  },

  async getMany(userIds: string[]): Promise<BillingDoc[]> {
    if (userIds.length === 0) return [];
    return (await billing()).find({ _id: { $in: userIds } }).toArray();
  },

  async remove(userId: string): Promise<void> {
    await (await billing()).deleteOne({ _id: userId });
  },

  async findByCustomer(customerId: string): Promise<BillingDoc | null> {
    return (await billing()).findOne({ stripeCustomerId: customerId });
  },

  /** Create the doc on first visit. Never overwrites an existing trial start. */
  async ensure(userId: string, trialStartedAt: string): Promise<BillingDoc> {
    const col = await billing();
    await col.updateOne(
      { _id: userId },
      { $setOnInsert: { trialStartedAt, plan: null, status: null } },
      { upsert: true },
    );
    return (await col.findOne({ _id: userId }))!;
  },

  async update(userId: string, patch: Partial<Omit<BillingDoc, "_id">>): Promise<BillingDoc | null> {
    const col = await billing();
    await col.updateOne({ _id: userId }, { $set: patch });
    return col.findOne({ _id: userId });
  },
};

import "server-only";
import type Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { PLANS, TRIAL_DAYS, type BillingStatus, type PlanId } from "@/lib/billing";
import { ACCESS_STATUSES, toStatus, trialEnd } from "@/server/billing/status";
import { getStripe, planForPrice, priceIdFor } from "@/server/billing/stripe";
import { AppError } from "@/server/http";
import { billingRepository, type BillingDoc } from "@/server/repositories/billing-repository";

/** Re-check Stripe at most this often, in case a webhook was missed. */
const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;

/** The billing doc, created on first visit with the trial starting at sign-up. */
async function loadDoc(userId: string): Promise<BillingDoc> {
  const existing = await billingRepository.get(userId);
  if (existing) return existing;
  let createdAt = Date.now();
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    if (user.createdAt) createdAt = user.createdAt;
  } catch (err) {
    console.error("[billing] Could not read Clerk user; trial starts now.", err);
  }
  return billingRepository.ensure(userId, new Date(createdAt).toISOString());
}

/** Copy the customer's best subscription from Stripe into Mongo. */
async function syncSubscriptions(doc: BillingDoc): Promise<BillingDoc> {
  if (!doc.stripeCustomerId) return doc;
  const subs = await getStripe().subscriptions.list({ customer: doc.stripeCustomerId, status: "all", limit: 20 });
  const best =
    subs.data.find((s) => ACCESS_STATUSES.has(s.status)) ??
    [...subs.data].sort((a, b) => b.created - a.created)[0];
  const item = best?.items.data[0];
  const patch: Partial<BillingDoc> = {
    plan: best ? await planForPrice(item?.price.id) : null,
    status: best?.status ?? null,
    subscriptionId: best?.id ?? null,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(best?.cancel_at_period_end || best?.cancel_at),
    lastSyncedAt: new Date().toISOString(),
  };
  return (await billingRepository.update(doc._id, patch)) ?? doc;
}

function needsSync(doc: BillingDoc, now = Date.now()): boolean {
  if (!doc.stripeCustomerId || doc.lifetimePaidAt) return false;
  if (!doc.lastSyncedAt || now - Date.parse(doc.lastSyncedAt) > SYNC_EVERY_MS) return true;
  return Boolean(doc.currentPeriodEnd && Date.parse(doc.currentPeriodEnd) < now);
}

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
  let doc = await loadDoc(userId);
  if (needsSync(doc)) {
    try {
      doc = await syncSubscriptions(doc);
    } catch (err) {
      // Stripe unreachable: trust what we have rather than locking a paying user out.
      console.error("[billing] Stripe sync failed:", err);
    }
  }
  return toStatus(doc);
}

/** Use in routes that cost money (Gemini) or add data. 402 tells the client to show the paywall. */
export async function requireAccess(userId: string): Promise<void> {
  const status = await getBillingStatus(userId);
  if (status.state === "expired") {
    throw new AppError(
      `Your ${TRIAL_DAYS}-day free trial has ended. Pick a plan to keep logging.`,
      402,
      "subscription_required",
    );
  }
}

async function ensureCustomer(doc: BillingDoc): Promise<string> {
  if (doc.stripeCustomerId) return doc.stripeCustomerId;
  let email: string | undefined;
  let name: string | undefined;
  try {
    const user = await (await clerkClient()).users.getUser(doc._id);
    email = user.primaryEmailAddress?.emailAddress;
    name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
  } catch {
    /* Checkout will ask for the email instead. */
  }
  const customer = await getStripe().customers.create({ email, name, metadata: { userId: doc._id } });
  await billingRepository.update(doc._id, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function createCheckoutSession(userId: string, plan: PlanId, origin: string): Promise<string> {
  const doc = await loadDoc(userId);
  const status = toStatus(doc);
  if (status.plan === "lifetime") throw new AppError("You already have lifetime access.", 409, "already_lifetime");
  if (PLANS[plan].recurring && status.state === "active") {
    throw new AppError("You already have a plan. Use Manage billing to switch or cancel.", 409, "already_subscribed");
  }

  const customer = await ensureCustomer(doc);
  const metadata = { userId, plan };
  const params: Stripe.Checkout.SessionCreateParams = {
    customer,
    client_reference_id: userId,
    metadata,
    line_items: [{ price: await priceIdFor(plan), quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/app/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/app/billing?canceled=1`,
  };

  if (PLANS[plan].recurring) {
    params.mode = "subscription";
    // Paying early keeps the free days that are left. Stripe needs the trial end 48h+ away.
    const remaining = trialEnd(doc) - Date.now();
    params.subscription_data = {
      metadata,
      ...(remaining > 49 * 60 * 60 * 1000 ? { trial_end: Math.floor(trialEnd(doc) / 1000) } : {}),
    };
  } else {
    params.mode = "payment";
    params.invoice_creation = { enabled: true, invoice_data: { metadata } };
    params.payment_intent_data = { metadata };
  }

  const session = await getStripe().checkout.sessions.create(params);
  if (!session.url) throw new AppError("Stripe did not return a checkout link.", 502, "checkout_failed");
  return session.url;
}

export async function createPortalSession(userId: string, origin: string): Promise<string> {
  const doc = await loadDoc(userId);
  if (!doc.stripeCustomerId) throw new AppError("There is no billing account yet.", 400, "no_customer");
  const session = await getStripe().billingPortal.sessions.create({
    customer: doc.stripeCustomerId,
    return_url: `${origin}/app/billing`,
  });
  return session.url;
}

/** Apply a finished Checkout. Called by the webhook and by the success page (whichever comes first). */
export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) return;
  const doc = await loadDoc(userId);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (customerId && !doc.stripeCustomerId) await billingRepository.update(userId, { stripeCustomerId: customerId });

  if (session.mode === "payment" && session.payment_status === "paid" && session.metadata?.plan === "lifetime") {
    if (!doc.lifetimePaidAt) {
      await billingRepository.update(userId, { lifetimePaidAt: new Date().toISOString(), plan: "lifetime", status: "paid" });
      // No more renewals for someone who bought lifetime.
      if (customerId) await stopRenewals(customerId);
    }
    return;
  }

  if (session.mode === "subscription") {
    const fresh = await billingRepository.get(userId);
    if (fresh) await syncSubscriptions(fresh);
  }
}

async function stopRenewals(customerId: string): Promise<void> {
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  for (const sub of subs.data) {
    if (ACCESS_STATUSES.has(sub.status) && !sub.cancel_at_period_end) {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    }
  }
}

/** The success page calls this with the session id from the redirect, so access unlocks without waiting for the webhook. */
export async function confirmCheckout(userId: string, sessionId: string): Promise<BillingStatus> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if ((session.client_reference_id ?? session.metadata?.userId) !== userId) {
    throw new AppError("This checkout belongs to another account.", 403, "forbidden");
  }
  await applyCheckoutSession(session);
  return toStatus(await loadDoc(userId));
}

/** Webhook: a subscription changed in Stripe (renewed, switched plan, canceled, payment failed). */
export async function syncCustomer(customerId: string): Promise<void> {
  const doc = await billingRepository.findByCustomer(customerId);
  if (doc) await syncSubscriptions(doc);
}

/** Webhook: a full refund of the lifetime payment takes lifetime access away. */
export async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId || !charge.refunded) return;
  const doc = await billingRepository.findByCustomer(customerId);
  if (!doc?.lifetimePaidAt) return;
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return;
  const intent = await getStripe().paymentIntents.retrieve(intentId);
  if (intent.metadata?.plan !== "lifetime") return;
  await billingRepository.update(doc._id, { lifetimePaidAt: null, plan: null, status: null });
  await syncSubscriptions({ ...doc, lifetimePaidAt: null });
}

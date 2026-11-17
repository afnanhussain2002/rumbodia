import type Stripe from "stripe";
import { getStripe } from "@/server/billing/stripe";
import { applyCheckoutSession, handleRefund, syncCustomer } from "@/server/services/billing-service";

export const dynamic = "force-dynamic";

/**
 * Stripe → Rumbodia. Add this endpoint in Stripe (Developers → Webhooks):
 *   https://<your-domain>/api/stripe/webhook
 * with the events below, then put its signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "STRIPE_WEBHOOK_SECRET is not set." }, { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await applyCheckoutSession(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const customer = event.data.object.customer;
        await syncCustomer(typeof customer === "string" ? customer : customer.id);
        break;
      }
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
    }
  } catch (err) {
    console.error(`[stripe] Webhook ${event.type} failed:`, err);
    // 500 makes Stripe retry later.
    return Response.json({ error: "Webhook handler failed." }, { status: 500 });
  }
  return Response.json({ received: true });
}

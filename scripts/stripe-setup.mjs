/**
 * Creates (or reuses) everything Rumbodia needs in Stripe. Safe to run again.
 *
 *   npm run stripe:setup
 *
 * - Product  "Rumbodia Pro"           (id: rumbodia_pro)
 * - Prices   $10/month, $99/year, $249 one-time  (lookup keys rumbodia_monthly / _yearly / _lifetime)
 * - Coupon   60% off, forever, all three prices, redeemable until BLACKFRIDAY_REDEEM_BY
 * - Code     BLACKFRIDAY  (what customers type at checkout)
 *
 * The app finds prices by lookup key, so no price ids need to go in .env.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing. Run with: node --env-file=.env scripts/stripe-setup.mjs");
  process.exit(1);
}
const stripe = new Stripe(key);

const PRODUCT_ID = "rumbodia_pro";
const PRICES = [
  { lookup_key: "rumbodia_monthly", nickname: "Monthly", unit_amount: 1000, recurring: { interval: "month" } },
  { lookup_key: "rumbodia_yearly", nickname: "Yearly", unit_amount: 9900, recurring: { interval: "year" } },
  { lookup_key: "rumbodia_lifetime", nickname: "Lifetime", unit_amount: 24900 },
];
const COUPON_ID = "BLACKFRIDAY60";
const PROMO_CODE = "BLACKFRIDAY";
/** Last moment a customer can apply the code. Anyone who used it keeps 60% off for as long as they stay subscribed. */
const REDEEM_BY = Math.floor(Date.parse(process.env.BLACKFRIDAY_REDEEM_BY ?? "2026-12-02T23:59:59Z") / 1000);

async function ensureProduct() {
  try {
    const product = await stripe.products.retrieve(PRODUCT_ID);
    console.log(`✓ Product ${product.id} exists`);
    return product;
  } catch (err) {
    if (err?.code !== "resource_missing") throw err;
    const product = await stripe.products.create({
      id: PRODUCT_ID,
      name: "Rumbodia Pro",
      description: "Unlimited daily logs scored by Gemini, weekly insights and full history.",
    });
    console.log(`+ Created product ${product.id}`);
    return product;
  }
}

async function ensurePrices() {
  const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookup_key), active: true, limit: 10 });
  for (const spec of PRICES) {
    const found = existing.data.find((p) => p.lookup_key === spec.lookup_key);
    if (found) {
      console.log(`✓ Price ${spec.lookup_key} exists (${found.id}, $${found.unit_amount / 100})`);
      continue;
    }
    const price = await stripe.prices.create({ product: PRODUCT_ID, currency: "usd", ...spec });
    console.log(`+ Created price ${spec.lookup_key} (${price.id}, $${spec.unit_amount / 100})`);
  }
}

async function ensureCoupon() {
  try {
    const coupon = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`✓ Coupon ${coupon.id} exists (${coupon.percent_off}% off, ${coupon.duration})`);
  } catch (err) {
    if (err?.code !== "resource_missing") throw err;
    const coupon = await stripe.coupons.create({
      id: COUPON_ID,
      name: "Black Friday 60% off",
      percent_off: 60,
      duration: "forever",
      redeem_by: REDEEM_BY,
      applies_to: { products: [PRODUCT_ID] },
    });
    console.log(`+ Created coupon ${coupon.id} (redeem by ${new Date(REDEEM_BY * 1000).toISOString()})`);
  }
}

async function ensurePromoCode() {
  const existing = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 });
  if (existing.data[0]) {
    console.log(`✓ Promotion code ${PROMO_CODE} exists (${existing.data[0].active ? "active" : "inactive"})`);
    return;
  }
  await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: COUPON_ID },
    code: PROMO_CODE,
    expires_at: REDEEM_BY,
  });
  console.log(`+ Created promotion code ${PROMO_CODE}`);
}

/** The "Manage billing" page: cancel, switch monthly <-> yearly, update card, see invoices. */
async function ensurePortal() {
  const configs = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
  if (configs.data[0]) {
    console.log(`✓ Billing portal configured (${configs.data[0].id})`);
    return;
  }
  const prices = await stripe.prices.list({ lookup_keys: ["rumbodia_monthly", "rumbodia_yearly"], active: true, limit: 10 });
  const config = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Manage your Rumbodia plan" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "name", "address"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [{ product: PRODUCT_ID, prices: prices.data.map((p) => p.id) }],
      },
    },
  });
  console.log(`+ Created billing portal configuration ${config.id}`);
}

const account = await stripe.accounts.retrieve();
console.log(`Stripe account ${account.id} (${key.startsWith("sk_live_") ? "LIVE" : "test"} mode)\n`);
await ensureProduct();
await ensurePrices();
await ensureCoupon();
await ensurePromoCode();
await ensurePortal();
console.log("\nDone.");

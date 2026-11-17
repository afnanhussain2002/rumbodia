import { describe, expect, it } from "vitest";
import { promoPrice } from "@/lib/billing";
import { toStatus } from "@/server/billing/status";
import type { BillingDoc } from "@/server/repositories/billing-repository";

const DAY = 24 * 60 * 60 * 1000;
const start = Date.parse("2026-11-01T00:00:00Z");
const doc = (patch: Partial<BillingDoc> = {}): BillingDoc => ({
  _id: "user_1",
  trialStartedAt: new Date(start).toISOString(),
  plan: null,
  status: null,
  ...patch,
});

describe("toStatus", () => {
  it("is a trial for 7 days after sign-up, then expires", () => {
    expect(toStatus(doc(), start + 6.9 * DAY).state).toBe("trial");
    expect(toStatus(doc(), start + 7 * DAY).state).toBe("expired");
    expect(toStatus(doc()).trialEndsAt).toBe("2026-11-08T00:00:00.000Z");
  });

  it("unlocks for active, trialing and past_due subscriptions", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      const s = toStatus(doc({ plan: "monthly", status }), start + 30 * DAY);
      expect(s.state).toBe("active");
      expect(s.plan).toBe("monthly");
    }
    expect(toStatus(doc({ plan: "monthly", status: "past_due" })).pastDue).toBe(true);
  });

  it("locks after the trial when the subscription is canceled or unpaid", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(toStatus(doc({ plan: "yearly", status }), start + 30 * DAY).state).toBe("expired");
    }
  });

  it("lifetime wins over everything", () => {
    const s = toStatus(doc({ lifetimePaidAt: "2026-11-02T00:00:00Z", plan: "monthly", status: "canceled" }), start + 900 * DAY);
    expect(s).toMatchObject({ state: "active", plan: "lifetime", currentPeriodEnd: null });
  });
});

describe("promoPrice", () => {
  it("takes 60% off", () => {
    expect(promoPrice(10)).toBe(4);
    expect(promoPrice(99)).toBe(39.6);
    expect(promoPrice(249)).toBe(99.6);
  });
});

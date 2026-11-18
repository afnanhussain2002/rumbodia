import { describe, expect, it } from "vitest";
import { adminAccessInputSchema } from "@/lib/schemas";
import { activeGrant, toStatus } from "@/server/billing/status";
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

describe("admin grants", () => {
  it("unlocks the app with the granted plan, marked as granted", () => {
    const s = toStatus(doc({ grantPlan: "lifetime", grantUntil: null }), start + 100 * DAY);
    expect(s).toMatchObject({ state: "active", plan: "lifetime", granted: true });
  });

  it("ends on grantUntil", () => {
    const until = new Date(start + 30 * DAY).toISOString();
    const d = doc({ grantPlan: "monthly", grantUntil: until });
    expect(toStatus(d, start + 29 * DAY)).toMatchObject({ state: "active", plan: "monthly", currentPeriodEnd: until });
    expect(toStatus(d, start + 31 * DAY).state).toBe("expired");
    expect(activeGrant(d, start + 31 * DAY)).toBeNull();
  });

  it("a real payment wins over a grant", () => {
    const s = toStatus(doc({ grantPlan: "monthly", plan: "yearly", status: "active" }), start + 10 * DAY);
    expect(s).toMatchObject({ plan: "yearly", granted: false });
  });

  it("extra trial days move the trial end", () => {
    const d = doc({ trialExtraDays: 7 });
    expect(toStatus(d, start + 10 * DAY).state).toBe("trial");
    expect(toStatus(d, start + 14 * DAY).state).toBe("expired");
  });
});

describe("adminAccessInputSchema", () => {
  it("accepts the five actions", () => {
    for (const input of [
      { action: "grant", plan: "yearly", days: 30 },
      { action: "revoke" },
      { action: "extendTrial", days: 7 },
      { action: "block" },
      { action: "unblock" },
    ]) {
      expect(adminAccessInputSchema.safeParse(input).success).toBe(true);
    }
  });

  it("rejects unknown plans and bad day counts", () => {
    expect(adminAccessInputSchema.safeParse({ action: "grant", plan: "free" }).success).toBe(false);
    expect(adminAccessInputSchema.safeParse({ action: "extendTrial", days: 0 }).success).toBe(false);
    expect(adminAccessInputSchema.safeParse({ action: "delete" }).success).toBe(false);
  });
});

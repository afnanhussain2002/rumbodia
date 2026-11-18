import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import type { AdminAccessInput } from "@/lib/schemas";
import type { AdminAuditItem, AdminUserDetail, AdminUserRow, AdminUserList } from "@/lib/admin";
import { adminEmails, isAdminEmail, type AdminIdentity } from "@/server/admin/auth";
import { activeGrant, toStatus, trialEnd } from "@/server/billing/status";
import { getStripe } from "@/server/billing/stripe";
import { collection } from "@/server/db/mongo";
import { AppError } from "@/server/http";
import { billingRepository, type BillingDoc } from "@/server/repositories/billing-repository";

const DAY_MS = 24 * 60 * 60 * 1000;

interface AuditDoc {
  adminUserId: string;
  adminEmail: string;
  action: AdminAuditItem["action"];
  targetUserId: string | null;
  targetEmail: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

async function logAction(
  admin: AdminIdentity,
  action: AuditDoc["action"],
  target: { userId: string; email: string | null },
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await (await collection<AuditDoc>("admin_audit")).insertOne({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action,
      targetUserId: target.userId,
      targetEmail: target.email,
      details,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // The change itself already happened; a missing log line must not turn it into an error.
    console.error("[admin] Could not write audit log:", err);
  }
}

const primaryEmail = (u: User) => u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null;
const fullName = (u: User) => [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
const iso = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString() : null);

/** A billing doc for users who never opened the app: trial counted from sign-up. */
const fallbackDoc = (u: User): BillingDoc => ({
  _id: u.id,
  trialStartedAt: new Date(u.createdAt || Date.now()).toISOString(),
  plan: null,
  status: null,
});

async function entryStats(userIds: string[]): Promise<Map<string, { count: number; last: string | null }>> {
  const map = new Map<string, { count: number; last: string | null }>();
  if (userIds.length === 0) return map;
  const rows = await (await collection("entries"))
    .aggregate<{ _id: string; count: number; last: string | null }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, last: { $max: "$createdAt" } } },
    ])
    .toArray();
  for (const r of rows) map.set(r._id, { count: r.count, last: r.last });
  return map;
}

function toRow(u: User, doc: BillingDoc | undefined, stats: { count: number; last: string | null } | undefined): AdminUserRow {
  const billing = toStatus(doc ?? fallbackDoc(u));
  const email = primaryEmail(u);
  return {
    id: u.id,
    email,
    name: fullName(u),
    imageUrl: u.imageUrl || null,
    createdAt: iso(u.createdAt),
    lastActiveAt: iso(u.lastActiveAt ?? u.lastSignInAt),
    banned: Boolean(u.banned),
    isAdmin: u.emailAddresses.some((e) => e.verification?.status === "verified" && isAdminEmail(e.emailAddress)),
    billing,
    entries: stats?.count ?? 0,
    lastEntryAt: stats?.last ?? null,
  };
}

export async function listUsers(params: { q?: string; page?: number; limit?: number }): Promise<AdminUserList> {
  const limit = Math.min(100, Math.max(1, params.limit ?? 25));
  const page = Math.max(1, params.page ?? 1);
  const q = params.q?.trim() || undefined;

  const clerk = await clerkClient();
  const { data, totalCount } = await clerk.users.getUserList({ query: q, limit, offset: (page - 1) * limit, orderBy: "-created_at" });
  const ids = data.map((u) => u.id);
  const [docs, stats] = await Promise.all([billingRepository.getMany(ids), entryStats(ids)]);
  const byId = new Map(docs.map((d) => [d._id, d]));

  return {
    items: data.map((u) => toRow(u, byId.get(u.id), stats.get(u.id))),
    total: totalCount,
    page,
    pages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

async function getClerkUser(userId: string): Promise<User> {
  try {
    return await (await clerkClient()).users.getUser(userId);
  } catch {
    throw new AppError("User not found.", 404, "not_found");
  }
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const u = await getClerkUser(userId);
  const [doc, stats, goals, audit] = await Promise.all([
    billingRepository.get(userId),
    entryStats([userId]),
    (await collection<{ _id: string; goals?: unknown[] }>("goals")).findOne({ _id: userId }),
    listAudit({ targetUserId: userId, limit: 20 }),
  ]);
  const d = doc ?? fallbackDoc(u);
  const grant = activeGrant(d);
  return {
    user: toRow(u, doc ?? undefined, stats.get(userId)),
    goals: goals?.goals?.length ?? 0,
    trialEndsAt: new Date(trialEnd(d)).toISOString(),
    trialExtraDays: d.trialExtraDays ?? 0,
    stripe: {
      customerId: d.stripeCustomerId ?? null,
      plan: d.plan ?? null,
      status: d.status ?? null,
      lifetimePaidAt: d.lifetimePaidAt ?? null,
    },
    grant: grant ? { plan: grant.plan, until: grant.until, by: d.grantedBy ?? null, at: d.grantedAt ?? null } : null,
    audit,
  };
}

/** Make sure a billing doc exists so a grant can be stored on it. */
async function ensureDoc(u: User): Promise<BillingDoc> {
  return (await billingRepository.get(u.id)) ?? billingRepository.ensure(u.id, new Date(u.createdAt || Date.now()).toISOString());
}

export async function changeAccess(admin: AdminIdentity, userId: string, input: AdminAccessInput): Promise<AdminUserDetail> {
  const u = await getClerkUser(userId);
  const target = { userId, email: primaryEmail(u) };
  const clerk = await clerkClient();
  const now = new Date();

  switch (input.action) {
    case "grant": {
      const doc = await ensureDoc(u);
      // Lifetime is always forever. For monthly/yearly, no days = forever.
      const until = input.plan === "lifetime" || !input.days ? null : new Date(now.getTime() + input.days * DAY_MS).toISOString();
      await billingRepository.update(userId, { grantPlan: input.plan, grantUntil: until, grantedBy: admin.email, grantedAt: now.toISOString() });
      await logAction(admin, "access.grant", target, {
        plan: input.plan,
        until,
        before: doc.grantPlan ? { plan: doc.grantPlan, until: doc.grantUntil ?? null } : null,
        note: input.note || undefined,
      });
      break;
    }
    case "revoke": {
      const doc = await ensureDoc(u);
      if (!doc.grantPlan) throw new AppError("This user has no granted access to remove.", 409, "no_grant");
      await billingRepository.update(userId, { grantPlan: null, grantUntil: null, grantedBy: null, grantedAt: null });
      await logAction(admin, "access.revoke", target, { plan: doc.grantPlan, note: input.note || undefined });
      break;
    }
    case "extendTrial": {
      const doc = await ensureDoc(u);
      // Count from today when the trial is already over, so "+7 days" always means 7 more days of use.
      const end = trialEnd(doc);
      const from = Math.max(end, now.getTime());
      const extra = (doc.trialExtraDays ?? 0) + Math.ceil((from - end) / DAY_MS) + input.days;
      await billingRepository.update(userId, { trialExtraDays: extra });
      await logAction(admin, "trial.extend", target, { days: input.days, totalExtraDays: extra, note: input.note || undefined });
      break;
    }
    case "block": {
      if (u.id === admin.userId) throw new AppError("You can't block your own account.", 400, "self");
      await clerk.users.banUser(userId);
      await logAction(admin, "user.block", target, { note: input.note || undefined });
      break;
    }
    case "unblock": {
      await clerk.users.unbanUser(userId);
      await logAction(admin, "user.unblock", target, { note: input.note || undefined });
      break;
    }
  }
  return getUserDetail(userId);
}

/**
 * Deletes everything: live Stripe subscriptions are canceled (so the card stops being charged),
 * all log data and billing state are removed, then the Clerk account. Admin accounts are refused.
 */
export async function deleteAccount(admin: AdminIdentity, userId: string, confirmEmail: string): Promise<void> {
  const u = await getClerkUser(userId);
  const email = primaryEmail(u);
  if (u.id === admin.userId) throw new AppError("You can't delete your own admin account here.", 400, "self");
  if (u.emailAddresses.some((e) => isAdminEmail(e.emailAddress))) {
    throw new AppError("This is an admin account. Remove it from ADMIN_EMAILS first.", 400, "is_admin");
  }
  if (!email || confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
    throw new AppError("Type the user's email exactly to confirm.", 400, "confirm_mismatch");
  }

  const doc = await billingRepository.get(userId);
  let canceledSubscriptions = 0;
  if (doc?.stripeCustomerId) {
    const stripe = getStripe();
    const subs = await stripe.subscriptions.list({ customer: doc.stripeCustomerId, status: "all", limit: 100 });
    for (const s of subs.data) {
      if (["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(s.status)) {
        await stripe.subscriptions.cancel(s.id);
        canceledSubscriptions++;
      }
    }
  }

  const [entries, insights, goals, settings] = await Promise.all([
    collection("entries"),
    collection("insights"),
    collection<{ _id: string }>("goals"),
    collection<{ _id: string }>("settings"),
  ]);
  const [deletedEntries] = await Promise.all([
    entries.deleteMany({ userId }).then((r) => r.deletedCount),
    insights.deleteMany({ userId }),
    goals.deleteOne({ _id: userId }),
    settings.deleteOne({ _id: userId }),
    billingRepository.remove(userId),
  ]);

  await (await clerkClient()).users.deleteUser(userId);
  await logAction(admin, "user.delete", { userId, email }, {
    entries: deletedEntries,
    canceledSubscriptions,
    stripeCustomerId: doc?.stripeCustomerId ?? null,
  });
}

export async function listAudit(params: { targetUserId?: string; limit?: number } = {}): Promise<AdminAuditItem[]> {
  const col = await collection<AuditDoc>("admin_audit");
  const rows = await col
    .find(params.targetUserId ? { targetUserId: params.targetUserId } : {})
    .sort({ createdAt: -1 })
    .limit(Math.min(200, params.limit ?? 100))
    .toArray();
  return rows.map((r) => ({
    id: String(r._id),
    action: r.action,
    adminEmail: r.adminEmail,
    targetUserId: r.targetUserId,
    targetEmail: r.targetEmail,
    details: r.details ?? null,
    createdAt: r.createdAt,
  }));
}

/** Who is on ADMIN_EMAILS and whether each has signed up. */
export async function listTeam(): Promise<{ email: string; userId: string | null; name: string | null }[]> {
  const emails = adminEmails();
  if (emails.length === 0) return [];
  const { data } = await (await clerkClient()).users.getUserList({ emailAddress: emails, limit: 100 });
  return emails.map((email) => {
    const u = data.find((x) => x.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email));
    return { email, userId: u?.id ?? null, name: u ? fullName(u) : null };
  });
}

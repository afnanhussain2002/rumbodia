import type { BillingStatus, PlanId } from "@/lib/billing";

/** Shapes the admin API sends to the admin screen. */

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  /** Blocked from signing in (Clerk ban). */
  banned: boolean;
  isAdmin: boolean;
  billing: BillingStatus;
  entries: number;
  lastEntryAt: string | null;
}

export interface AdminUserList {
  items: AdminUserRow[];
  total: number;
  page: number;
  pages: number;
}

export type AdminAction = "access.grant" | "access.revoke" | "trial.extend" | "user.block" | "user.unblock" | "user.delete";

export interface AdminAuditItem {
  id: string;
  action: AdminAction;
  adminEmail: string;
  targetUserId: string | null;
  targetEmail: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUserRow;
  goals: number;
  trialEndsAt: string;
  trialExtraDays: number;
  stripe: { customerId: string | null; plan: PlanId | null; status: string | null; lifetimePaidAt: string | null };
  /** Access given by an admin. `until` null = forever. */
  grant: { plan: PlanId; until: string | null; by: string | null; at: string | null } | null;
  audit: AdminAuditItem[];
}

export interface AdminMe {
  isAdmin: boolean;
  email: string | null;
}

export const ADMIN_ACTION_LABELS: Record<AdminAction, string> = {
  "access.grant": "Gave access",
  "access.revoke": "Removed access",
  "trial.extend": "Extended trial",
  "user.block": "Blocked",
  "user.unblock": "Unblocked",
  "user.delete": "Deleted account",
};

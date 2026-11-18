import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { AppError } from "@/server/http";

/**
 * Who may open /app/admin and call /api/admin/*.
 *
 * Admins are listed in the ADMIN_EMAILS env var (comma separated, case insensitive). It lives in the
 * environment on purpose: nothing a user can reach through the app can promote an account, and the
 * list changes only with a deploy. With the variable unset nobody is an admin.
 *
 * Only a VERIFIED Clerk email counts, so adding an unverified address to an account never grants access.
 */

export interface AdminIdentity {
  userId: string;
  /** The address that matched ADMIN_EMAILS (lower-cased). */
  email: string;
  name: string;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    // Strip quotes too: pasting a .env line into a hosting dashboard can keep them.
    .map((s) => s.trim().replace(/^["']+|["']+$/g, "").toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/** The signed-in admin, or null when signed out / not on the list. */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (adminEmails().length === 0) return null;
  const user = await currentUser();
  if (!user) return null;

  const verified = user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());
  // Prefer the primary address so the activity log names the one they sign in with.
  const primary = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  const ordered = primary && verified.includes(primary) ? [primary, ...verified.filter((e) => e !== primary)] : verified;
  const match = ordered.find((e) => isAdminEmail(e));
  if (!match) return null;

  const name = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || match;
  return { userId: user.id, email: match, name };
}

/** Route guard: 401 when signed out, 403 when not an admin. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const user = await currentUser();
  if (!user) throw new AppError("Please sign in to continue.", 401, "unauthenticated");
  const admin = await getAdminIdentity();
  if (!admin) throw new AppError("Admin access required.", 403, "admin_required");
  return admin;
}

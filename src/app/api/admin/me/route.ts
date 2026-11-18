import { auth } from "@clerk/nextjs/server";
import { ok, toErrorResponse } from "@/server/http";
import { getAdminIdentity } from "@/server/admin/auth";

export const dynamic = "force-dynamic";

/** Tells the shell whether to show the Admin link. Never errors for non-admins. */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return ok({ isAdmin: false, email: null });
    const admin = await getAdminIdentity();
    return ok({ isAdmin: Boolean(admin), email: admin?.email ?? null });
  } catch (err) {
    return toErrorResponse(err);
  }
}

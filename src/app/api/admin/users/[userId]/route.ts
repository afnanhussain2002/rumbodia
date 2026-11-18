import { adminDeleteInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { requireAdmin } from "@/server/admin/auth";
import { deleteAccount, getUserDetail } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { userId } = await context.params;
    return ok(await getUserDetail(userId));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** Deletes the account and everything in it. Body: { confirmEmail } must match the user's email. */
export async function DELETE(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { userId } = await context.params;
    const { confirmEmail } = adminDeleteInputSchema.parse(await readJson(request));
    await deleteAccount(admin, userId, confirmEmail);
    return ok({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

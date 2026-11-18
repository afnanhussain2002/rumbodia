import { adminAccessInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { requireAdmin } from "@/server/admin/auth";
import { changeAccess } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ userId: string }> };

/** Give / remove access, extend the trial, block or unblock. */
export async function POST(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { userId } = await context.params;
    const input = adminAccessInputSchema.parse(await readJson(request));
    return ok(await changeAccess(admin, userId, input));
  } catch (err) {
    return toErrorResponse(err);
  }
}

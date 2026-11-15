import { requireUserId } from "@/server/auth";
import { deleteAllInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { deleteAllData } from "@/server/services/data-service";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    deleteAllInputSchema.parse(await readJson(request));
    await deleteAllData(userId);
    return ok({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

import { requireUserId } from "@/server/auth";
import { patchEntryInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { deleteEntry, updateEntry } from "@/server/services/entries-service";
import { getRequestTimezone } from "@/server/timezone";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const patch = patchEntryInputSchema.parse(await readJson(request));
    return ok({ entry: await updateEntry(userId, id, patch, getRequestTimezone(request)) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await deleteEntry(userId, id);
    return ok({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

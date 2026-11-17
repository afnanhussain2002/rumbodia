import { requireUserId } from "@/server/auth";
import { requireAccess } from "@/server/services/billing-service";
import { entrySchema } from "@/lib/schemas";
import { AppError, ok, readJson, toErrorResponse } from "@/server/http";
import { normalizeEntry } from "@/server/repositories/entries-repository";
import { restoreEntry } from "@/server/services/entries-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    await requireAccess(userId);
    const { id } = await context.params;
    const parsed = entrySchema.parse(await readJson(request));
    if (parsed.id !== id) throw new AppError("The update id does not match the URL.", 400, "id_mismatch");
    const entry = normalizeEntry(parsed);
    if (!entry) throw new AppError("That update could not be restored.", 400, "invalid_entry");
    return ok({ entry: await restoreEntry(userId, entry) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

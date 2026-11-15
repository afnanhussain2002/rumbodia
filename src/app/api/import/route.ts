import { requireUserId } from "@/server/auth";
import { importInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { importData } from "@/server/services/data-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = importInputSchema.parse(await readJson(request));
    return ok({ imported: await importData(userId, input) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

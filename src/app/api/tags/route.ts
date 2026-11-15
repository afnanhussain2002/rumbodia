import { requireUserId } from "@/server/auth";
import { ok, toErrorResponse } from "@/server/http";
import { entriesRepository } from "@/server/repositories/entries-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return ok({ tags: await entriesRepository.tags(userId) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

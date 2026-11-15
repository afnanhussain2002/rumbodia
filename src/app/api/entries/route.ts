import { requireUserId } from "@/server/auth";
import { createEntryInputSchema, listEntriesQuerySchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { entriesRepository } from "@/server/repositories/entries-repository";
import { createEntry } from "@/server/services/entries-service";
import { getRequestTimezone } from "@/server/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const filter = listEntriesQuerySchema.parse(params);
    return ok({ entries: await entriesRepository.list(userId, filter) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = createEntryInputSchema.parse(await readJson(request));
    const entry = await createEntry(userId, input, getRequestTimezone(request));
    return ok({ entry }, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}

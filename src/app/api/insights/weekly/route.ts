import { requireUserId } from "@/server/auth";
import { requireAccess } from "@/server/services/billing-service";
import { weekStartQuerySchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { getWeeklyInsight, regenerateWeeklyInsight } from "@/server/services/insights-service";
import { getRequestTimezone } from "@/server/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    await requireAccess(userId);
    const { weekStart } = weekStartQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return ok(await getWeeklyInsight(userId, weekStart, getRequestTimezone(request)));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    await requireAccess(userId);
    const { weekStart } = weekStartQuerySchema.parse(await readJson(request));
    return ok({ insight: await regenerateWeeklyInsight(userId, weekStart, getRequestTimezone(request)) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

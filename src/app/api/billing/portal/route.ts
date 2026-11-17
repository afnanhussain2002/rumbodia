import { requireUserId } from "@/server/auth";
import { ok, toErrorResponse } from "@/server/http";
import { appOrigin } from "@/server/origin";
import { createPortalSession } from "@/server/services/billing-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    return ok({ url: await createPortalSession(userId, appOrigin(request)) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

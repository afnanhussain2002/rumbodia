import { requireUserId } from "@/server/auth";
import { ok, toErrorResponse } from "@/server/http";
import { getBillingStatus } from "@/server/services/billing-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return ok({ billing: await getBillingStatus(userId) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

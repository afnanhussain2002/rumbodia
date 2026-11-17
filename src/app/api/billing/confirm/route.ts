import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { confirmCheckout } from "@/server/services/billing-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ sessionId: z.string().startsWith("cs_", { message: "Invalid checkout session." }) });

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { sessionId } = bodySchema.parse(await readJson(request));
    return ok({ billing: await confirmCheckout(userId, sessionId) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

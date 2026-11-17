import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { appOrigin } from "@/server/origin";
import { createCheckoutSession } from "@/server/services/billing-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ plan: z.enum(["monthly", "yearly", "lifetime"], { message: "Pick a plan." }) });

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { plan } = bodySchema.parse(await readJson(request));
    return ok({ url: await createCheckoutSession(userId, plan, appOrigin(request)) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

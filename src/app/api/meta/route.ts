import { APP_VERSION } from "@/lib/constants";
import { ok, toErrorResponse } from "@/server/http";
import { getModelName } from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ model: getModelName(), version: APP_VERSION });
  } catch (err) {
    return toErrorResponse(err);
  }
}

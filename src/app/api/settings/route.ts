import { requireUserId } from "@/server/auth";
import { settingsPatchSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { settingsRepository } from "@/server/repositories/settings-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return ok({ settings: await settingsRepository.get(userId) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const patch = settingsPatchSchema.parse(await readJson(request));
    return ok({ settings: await settingsRepository.update(userId, patch) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

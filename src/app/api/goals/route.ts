import { requireUserId } from "@/server/auth";
import { updateGoalsInputSchema } from "@/lib/schemas";
import { ok, readJson, toErrorResponse } from "@/server/http";
import { goalsRepository } from "@/server/repositories/goals-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    return ok({ goals: await goalsRepository.list(userId) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const { goals } = updateGoalsInputSchema.parse(await readJson(request));
    return ok({ goals: await goalsRepository.save(userId, goals) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

import { ok, toErrorResponse } from "@/server/http";
import { requireAdmin } from "@/server/admin/auth";
import { listTeam } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    return ok({ you: admin.email, members: await listTeam() });
  } catch (err) {
    return toErrorResponse(err);
  }
}

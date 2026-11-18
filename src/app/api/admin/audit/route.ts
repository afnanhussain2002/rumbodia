import { ok, toErrorResponse } from "@/server/http";
import { requireAdmin } from "@/server/admin/auth";
import { listAudit } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return ok({ items: await listAudit({ limit: 100 }) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

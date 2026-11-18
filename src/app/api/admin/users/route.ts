import { ok, toErrorResponse } from "@/server/http";
import { requireAdmin } from "@/server/admin/auth";
import { listUsers } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

/** GET /api/admin/users?q=&page= */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const sp = new URL(request.url).searchParams;
    return ok(await listUsers({ q: sp.get("q") ?? undefined, page: Number(sp.get("page")) || 1, limit: 25 }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

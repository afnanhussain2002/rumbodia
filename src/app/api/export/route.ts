import { requireUserId } from "@/server/auth";
import { toErrorResponse } from "@/server/http";
import { exportCsv, exportJson } from "@/server/services/data-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      return new Response(await exportCsv(userId), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rumbodia-entries-${stamp}.csv"`,
        },
      });
    }
    return new Response(JSON.stringify(await exportJson(userId), null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="rumbodia-${stamp}.json"`,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

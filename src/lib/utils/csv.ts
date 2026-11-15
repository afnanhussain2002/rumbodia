import type { Entry } from "@/types";

function cell(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS = ["id", "createdAt", "timeOfDay", "score", "text", "reason", "wins", "slips", "tags", "boosts", "drains", "updatedAt", "model"] as const;

/** Entries as CSV (RFC 4180 quoting). List fields are joined with " | ". */
export function entriesToCsv(entries: Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.id,
      e.createdAt,
      e.timeOfDay,
      e.score,
      e.text,
      e.reason,
      e.wins.join(" | "),
      e.slips.join(" | "),
      e.tags.join(" | "),
      e.boosts.join(" | "),
      e.drains.join(" | "),
      e.updatedAt,
      e.model,
    ]
      .map(cell)
      .join(","),
  );
  return [COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}

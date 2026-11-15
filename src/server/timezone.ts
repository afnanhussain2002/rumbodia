import "server-only";
import type { TimeOfDayStarts, TimeOfDay } from "@/types";
import { timeOfDayFromMinutes } from "@/lib/utils/date";

/** The server's own zone, used when the client sends nothing valid. */
export function serverTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The client's IANA zone from the `x-timezone` header, or the server zone. */
export function getRequestTimezone(request: Request): string {
  const tz = request.headers.get("x-timezone")?.trim();
  return tz && isValidTimezone(tz) ? tz : serverTimezone();
}

function parts(iso: string, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const map = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return map as Record<string, string>;
}

/** Local YYYY-MM-DD of an instant in a zone. */
export function dayKeyInZone(iso: string, tz: string): string {
  const p = parts(iso, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

export function timeOfDayInZone(iso: string, tz: string, starts: TimeOfDayStarts): TimeOfDay {
  const p = parts(iso, tz);
  return timeOfDayFromMinutes(Number(p.hour) * 60 + Number(p.minute), starts);
}

/** "Wed 2026-11-04 07:42" in the given zone, for prompts. */
export function formatLocalTimestamp(iso: string, tz: string): string {
  const p = parts(iso, tz);
  return `${p.weekday} ${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (${tz})`;
}

import type {
  ApiErrorBody,
  Entry,
  ExportBundle,
  Goal,
  Meta,
  Settings,
  TagCount,
  TimeOfDay,
  WeeklyInsight,
} from "@/types";

/** The only place in the browser that calls `fetch`. */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", "x-timezone": timezone(), ...init?.headers },
    });
  } catch {
    throw new ApiError("Could not reach the app server. Is it still running?", 0, "network");
  }

  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!res.ok) {
    const err = body && typeof body === "object" && "error" in body ? body.error : null;
    // Session expired or signed out in another tab: go sign in again.
    if (res.status === 401 && typeof window !== "undefined") window.location.assign("/sign-in");
    throw new ApiError(err?.message ?? `Request failed (${res.status}).`, res.status, err?.code);
  }
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) });

export interface EntryQuery {
  from?: string;
  to?: string;
  tag?: string;
  q?: string;
}

export interface NewEntryInput {
  text: string;
  timeOfDay?: TimeOfDay;
  createdAt?: string;
  boosts?: string[];
  drains?: string[];
}

export interface EntryPatch {
  text?: string;
  timeOfDay?: TimeOfDay;
  createdAt?: string;
  boosts?: string[];
  drains?: string[];
  rescore?: boolean;
}

export const api = {
  listEntries: (query: EntryQuery = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
    const qs = params.toString();
    return request<{ entries: Entry[] }>(`/api/entries${qs ? `?${qs}` : ""}`).then((r) => r.entries);
  },

  createEntry: (input: NewEntryInput) =>
    request<{ entry: Entry }>("/api/entries", json("POST", input)).then((r) => r.entry),

  updateEntry: (id: string, patch: EntryPatch) =>
    request<{ entry: Entry }>(`/api/entries/${encodeURIComponent(id)}`, json("PATCH", patch)).then((r) => r.entry),

  restoreEntry: (entry: Entry) =>
    request<{ entry: Entry }>(`/api/entries/${encodeURIComponent(entry.id)}/restore`, json("POST", entry)).then(
      (r) => r.entry,
    ),

  deleteEntry: (id: string) => request<{ ok: true }>(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listTags: () => request<{ tags: TagCount[] }>("/api/tags").then((r) => r.tags),

  getGoals: () => request<{ goals: Goal[] }>("/api/goals").then((r) => r.goals),

  saveGoals: (goals: Goal[]) => request<{ goals: Goal[] }>("/api/goals", json("PUT", { goals })).then((r) => r.goals),

  getSettings: () => request<{ settings: Settings }>("/api/settings").then((r) => r.settings),

  saveSettings: (patch: Partial<Settings>) =>
    request<{ settings: Settings }>("/api/settings", json("PUT", patch)).then((r) => r.settings),

  getWeeklyInsight: (weekStart: string) =>
    request<{ insight: WeeklyInsight | null; reason?: string }>(
      `/api/insights/weekly?weekStart=${encodeURIComponent(weekStart)}`,
    ),

  regenerateWeeklyInsight: (weekStart: string) =>
    request<{ insight: WeeklyInsight }>("/api/insights/weekly", json("POST", { weekStart })).then((r) => r.insight),

  importData: (data: unknown, mode: "merge" | "replace") =>
    request<{ imported: { entries: number; goals: number } }>("/api/import", json("POST", { data, mode })).then(
      (r) => r.imported,
    ),

  deleteAllData: () => request<{ ok: true }>("/api/data", json("DELETE", { confirm: "DELETE" })),

  getMeta: () => request<Meta>("/api/meta"),

  exportUrl: (format: "json" | "csv") => `/api/export?format=${format}`,
};

export type { ExportBundle };

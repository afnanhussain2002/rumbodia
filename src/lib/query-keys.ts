/** React Query keys. `entries` is a prefix: invalidating ["entries"] refreshes every range. */
export const queryKeys = {
  entries: (from: string | null = null, to: string | null = null) => ["entries", from, to] as const,
  allEntries: ["entries"] as const,
  goals: ["goals"] as const,
  settings: ["settings"] as const,
  tags: ["tags"] as const,
  insight: (weekStart: string) => ["insight", weekStart] as const,
  allInsights: ["insight"] as const,
  meta: ["meta"] as const,
  billing: ["billing"] as const,
};

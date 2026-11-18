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
  adminMe: ["admin", "me"] as const,
  adminUsers: (q: string, page: number) => ["admin", "users", q, page] as const,
  adminUser: (userId: string) => ["admin", "user", userId] as const,
  adminAudit: ["admin", "audit"] as const,
  adminTeam: ["admin", "team"] as const,
  admin: ["admin"] as const,
};

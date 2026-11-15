"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { dayRange, monthRange } from "@/lib/utils/date";

/** Entries in [from, to). Both null = all entries. */
export function useEntriesQuery(from: string | null = null, to: string | null = null) {
  return useQuery({
    queryKey: queryKeys.entries(from, to),
    queryFn: () => api.listEntries({ from: from ?? undefined, to: to ?? undefined }),
  });
}

export function useMonthEntries(month: string) {
  const { from, to } = monthRange(month);
  return useEntriesQuery(from, to);
}

export function useDayRangeEntries(fromDay: string, toDay: string) {
  const { from, to } = dayRange(fromDay, toDay);
  return useEntriesQuery(from, to);
}

/** Every entry (streaks, search, year views). Fine for local single-user data. */
export function useAllEntries() {
  return useEntriesQuery(null, null);
}

export function useTagsQuery() {
  return useQuery({ queryKey: queryKeys.tags, queryFn: api.listTags });
}

export function useMetaQuery() {
  return useQuery({ queryKey: queryKeys.meta, queryFn: api.getMeta, staleTime: Infinity });
}

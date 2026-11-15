"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isMonthKey, shiftMonthKey, toMonthKey } from "@/lib/utils/date";

export function currentMonthKey(): string {
  return toMonthKey(new Date());
}

/** Build a URL for `path` that keeps the given params. */
export function withParams(path: string, params: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Updates search params in place (replace, no scroll). */
export function useSetSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (changes: Record<string, string | null>, mode: "replace" | "push" = "replace") => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

/** The selected month lives in the URL (`?month=2026-11`), so switching tabs keeps it. */
export function useMonthParam() {
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();
  const raw = searchParams.get("month");
  const thisMonth = currentMonthKey();
  const month = isMonthKey(raw) && raw <= thisMonth ? raw : thisMonth;

  const setMonth = useCallback(
    (next: string) => {
      if (next > thisMonth) return;
      setParams({ month: next === thisMonth ? null : next, day: null });
    },
    [setParams, thisMonth],
  );

  return useMemo(
    () => ({
      month,
      isCurrentMonth: month === thisMonth,
      setMonth,
      prev: () => setMonth(shiftMonthKey(month, -1)),
      next: () => setMonth(shiftMonthKey(month, 1)),
      canGoNext: month < thisMonth,
    }),
    [month, thisMonth, setMonth],
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DEFAULT_SETTINGS, THEME_STORAGE_KEY } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import type { Settings } from "@/types";
import { useToast } from "@/components/ui/toast";

/** Settings, falling back to defaults while loading (never blocks the UI). */
export function useSettings(): Settings & { isLoaded: boolean } {
  const query = useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings, staleTime: 5 * 60_000 });
  return { ...(query.data ?? DEFAULT_SETTINGS), isLoaded: query.isSuccess };
}

/** Apply a theme to <html> and remember it for the no-flash script. */
export function applyTheme(theme: Settings["theme"]) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }
}

/** Optimistic settings update; rolls back on error. */
export function useSaveSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => api.saveSettings(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.settings });
      const previous = qc.getQueryData<Settings>(queryKeys.settings);
      const next = { ...(previous ?? DEFAULT_SETTINGS), ...patch };
      qc.setQueryData(queryKeys.settings, next);
      if (patch.theme) applyTheme(patch.theme);
      return { previous };
    },
    onError: (err, _patch, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.settings, ctx.previous);
        applyTheme(ctx.previous.theme);
      }
      toast.show({ message: `Settings not saved. ${(err as Error).message}`, tone: "error" });
    },
    onSuccess: (settings) => qc.setQueryData(queryKeys.settings, settings),
  });
}

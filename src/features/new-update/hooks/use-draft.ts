"use client";

import { useCallback } from "react";
import { DRAFT_STORAGE_KEY } from "@/lib/constants";

/** The unsent draft lives in localStorage so closing the sheet does not lose it. */
export function useDraft() {
  const load = useCallback((): string => {
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  }, []);

  const save = useCallback((text: string) => {
    try {
      if (text.trim()) localStorage.setItem(DRAFT_STORAGE_KEY, text);
      else localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* storage unavailable: the draft just won't survive a reload */
    }
  }, []);

  const clear = useCallback(() => save(""), [save]);

  return { load, save, clear };
}

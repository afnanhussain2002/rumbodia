"use client";

import { createContext, useContext } from "react";
import type { Entry } from "@/types";

export interface NewUpdateRequest {
  /** Backfill: log for this local day. */
  day?: string;
  /** Edit an existing entry. */
  entry?: Entry;
}

export interface ShellApi {
  openNewUpdate: (request?: NewUpdateRequest) => void;
  openSearch: () => void;
  /** Open the Day sheet (adds ?day= to the URL so Back closes it). */
  openDay: (day: string) => void;
  closeDay: () => void;
  /** Ask the Stats chart to select and scroll to a day (after "See my chart"). */
  focusChart: (day: string) => void;
  chartFocus: { day: string; nonce: number } | null;
  /** Day of the most recently scored update, for the chart animation. */
  lastScored: { day: string; nonce: number } | null;
}

export const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}

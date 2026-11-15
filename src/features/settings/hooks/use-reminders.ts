"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { TIME_OF_DAY_LABELS } from "@/lib/constants";
import { timeOfDayFromMinutes, toDayKey } from "@/lib/utils/date";
import type { TimeOfDayStarts } from "@/types";

/** Reminder times are a per-browser UI preference, so they live in localStorage. */
const KEY = "rumbodia:reminders";
const FIRED_KEY = "rumbodia:reminders-fired";

export interface ReminderPrefs {
  enabled: boolean;
  times: string[];
}

const DEFAULT: ReminderPrefs = { enabled: false, times: ["08:00", "12:30", "21:00"] };
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: ReminderPrefs } | null = null;

function read(): ReminderPrefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* unavailable */
  }
  if (cache && cache.raw === raw) return cache.value;
  let value = DEFAULT;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<ReminderPrefs>) : null;
    if (parsed && Array.isArray(parsed.times)) {
      value = {
        enabled: !!parsed.enabled,
        times: parsed.times.filter((t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 4),
      };
    }
  } catch {
    /* corrupt: use defaults */
  }
  cache = { raw, value };
  return value;
}

function write(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* unavailable */
  }
  listeners.forEach((l) => l());
}

export function useReminderPrefs() {
  const prefs = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT,
  );
  const update = useCallback((patch: Partial<ReminderPrefs>) => write({ ...read(), ...patch }), []);
  return [prefs, update] as const;
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Fires local notifications at the chosen times while the tab is open. */
export function useReminderRunner(starts: TimeOfDayStarts) {
  const [prefs] = useReminderPrefs();

  useEffect(() => {
    if (!prefs.enabled || !notificationsSupported() || Notification.permission !== "granted") return;

    function check() {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (!prefs.times.includes(hhmm)) return;
      const stamp = `${toDayKey(now)} ${hhmm}`;
      let fired: string[] = [];
      try {
        fired = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]") as string[];
      } catch {
        fired = [];
      }
      if (fired.includes(stamp)) return;
      try {
        localStorage.setItem(FIRED_KEY, JSON.stringify([...fired.slice(-20), stamp]));
      } catch {
        /* unavailable */
      }
      const part = timeOfDayFromMinutes(now.getHours() * 60 + now.getMinutes(), starts);
      new Notification("Rumbodia", {
        body: `Time for your ${TIME_OF_DAY_LABELS[part].toLowerCase()} update?`,
        icon: "/icons/icon-192.png",
        tag: "rumbodia-reminder",
      });
    }

    check();
    const id = setInterval(check, 20_000);
    return () => clearInterval(id);
  }, [prefs.enabled, prefs.times, starts]);
}

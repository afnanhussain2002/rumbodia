import { BarChart3, CalendarDays, CreditCard, Database, LayoutGrid, List, Settings, Target } from "lucide-react";

export const MONTH_TABS = ["/app/stats", "/app/entries", "/app/calendar"] as const;

export const isMonthTab = (pathname: string) => MONTH_TABS.some((t) => pathname.startsWith(t));

/** Bottom bar (mobile/tablet). The + button sits in the middle. */
export const TAB_ITEMS = [
  { href: "/app/entries", label: "Entries", icon: List },
  { href: "/app/stats", label: "Stats", icon: BarChart3 },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/more", label: "More", icon: LayoutGrid },
] as const;

/** Sidebar (desktop). The More menu's items live here directly. */
export const SIDEBAR_ITEMS = [
  { href: "/app/stats", label: "Stats", icon: BarChart3 },
  { href: "/app/entries", label: "Entries", icon: List },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/more/goals", label: "Goals", icon: Target },
  { href: "/app/more/settings", label: "Settings", icon: Settings },
  { href: "/app/more/data", label: "Your data", icon: Database },
  { href: "/app/billing", label: "Plan & billing", icon: CreditCard },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/app/more": "More",
  "/app/more/goals": "Goals",
  "/app/more/settings": "Settings",
  "/app/more/data": "Your data",
  "/app/billing": "Plan & billing",
};

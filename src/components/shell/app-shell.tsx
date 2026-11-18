"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Entry } from "@/types";
import { isDayKey, isoToDayKey, toMonthKey } from "@/lib/utils/date";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useMonthParam, withParams } from "@/hooks/use-month-param";
import { Sheet } from "@/components/ui/sheet";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { MonthHeader } from "@/components/shell/month-header";
import { isMonthTab, PAGE_TITLES } from "@/components/shell/nav-items";
import { ShellContext, type NewUpdateRequest, type ShellApi } from "@/components/shell/shell-context";
import { Sidebar } from "@/components/shell/sidebar";
import { BackgroundBlobs } from "@/components/fun/decor";
import { DaySheet } from "@/features/calendar/components/day-sheet";
import { SearchPanel } from "@/features/entries/components/search-panel";
import { NewUpdateSheet } from "@/features/new-update/components/new-update-sheet";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useReminderRunner } from "@/features/settings/hooks/use-reminders";
import { isPaywalled, Paywall, TrialBanner } from "@/features/billing/components/paywall";
import { useBilling } from "@/features/billing/hooks/use-billing";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthNav = useMonthParam();
  const isDesktop = useIsDesktop();
  const settings = useSettings();
  useReminderRunner(settings.timeOfDayStarts);
  const billing = useBilling();
  const expired = billing.data?.state === "expired";
  const locked = expired && isPaywalled(pathname);

  const [newRequest, setNewRequest] = useState<NewUpdateRequest | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chartFocus, setChartFocus] = useState<ShellApi["chartFocus"]>(null);
  const [lastScored, setLastScored] = useState<ShellApi["lastScored"]>(null);
  const pushedDay = useRef(false);

  const monthPage = isMonthTab(pathname);
  const rawDay = searchParams.get("day");
  const day = isDayKey(rawDay) ? rawDay : null;
  // On desktop the Calendar shows the selected day inline, so no drawer there.
  const showDaySheet = day !== null && !(isDesktop && pathname.startsWith("/app/calendar"));

  const hrefFor = useCallback(
    (path: string) => withParams(path, { month: monthNav.isCurrentMonth ? null : monthNav.month }),
    [monthNav.isCurrentMonth, monthNav.month],
  );

  const openDay = useCallback(
    (target: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const targetMonth = target.slice(0, 7);
      if (targetMonth === toMonthKey(new Date())) next.delete("month");
      else next.set("month", targetMonth);
      next.set("day", target);
      const url = `${pathname}?${next.toString()}`;
      if (day) router.replace(url, { scroll: false });
      else {
        pushedDay.current = true;
        router.push(url, { scroll: false });
      }
    },
    [searchParams, pathname, router, day],
  );

  const closeDay = useCallback(() => {
    if (pushedDay.current) {
      pushedDay.current = false;
      router.back();
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete("day");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, searchParams, pathname]);

  const api = useMemo<ShellApi>(
    () => ({
      openNewUpdate: (request = {}) => (expired ? router.push("/app/billing") : setNewRequest(request)),
      openSearch: () => setSearchOpen(true),
      openDay,
      closeDay,
      focusChart: (d) => setChartFocus({ day: d, nonce: Date.now() }),
      chartFocus,
      lastScored,
    }),
    [openDay, closeDay, chartFocus, lastScored, expired, router],
  );

  useKeyboardShortcuts({
    n: () => api.openNewUpdate(),
    ArrowLeft: () => monthPage && monthNav.prev(),
    ArrowRight: () => monthPage && monthNav.canGoNext && monthNav.next(),
  });

  function onSeeChart(entry: Entry) {
    const d = isoToDayKey(entry.createdAt);
    const m = d.slice(0, 7);
    setChartFocus({ day: d, nonce: Date.now() });
    router.push(withParams("/app/stats", { month: m === toMonthKey(new Date()) ? null : m }));
  }

  const title = PAGE_TITLES[pathname] ?? "Rumbodia";

  return (
    <ShellContext.Provider value={api}>
      <BackgroundBlobs />
      <Sidebar hrefFor={hrefFor} onNew={() => api.openNewUpdate()} />
      <div className="min-h-[100dvh] md:pl-[72px] lg:pl-[240px] 2xl:pl-[260px]">
        <MonthHeader
          month={monthPage ? monthNav.month : null}
          title={title}
          canGoNext={monthNav.canGoNext}
          onPrev={monthNav.prev}
          onNext={monthNav.next}
          onSearch={() => setSearchOpen(true)}
          onNew={() => api.openNewUpdate()}
        />
        <main
          id="main"
          className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-[calc(74px+env(safe-area-inset-bottom)+32px)] sm:px-6 sm:pt-6 md:pb-12 lg:max-w-[1100px] lg:px-8 xl:max-w-[1180px] 2xl:max-w-[1240px]"
        >
          <TrialBanner />
          {locked ? <Paywall /> : children}
        </main>
      </div>
      <BottomTabBar hrefFor={hrefFor} onNew={() => api.openNewUpdate()} />

      <NewUpdateSheet
        request={newRequest}
        onClose={() => setNewRequest(null)}
        onScored={(entry) => setLastScored({ day: isoToDayKey(entry.createdAt), nonce: Date.now() })}
        onSeeChart={onSeeChart}
      />

      <DaySheet day={showDaySheet ? day : null} onClose={closeDay} />

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" variant="panel" className="sm:min-h-[60dvh]">
        <SearchPanel autoFocus onPicked={() => setSearchOpen(false)} />
      </Sheet>
    </ShellContext.Provider>
  );
}


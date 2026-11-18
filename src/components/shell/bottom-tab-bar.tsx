"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { FabButton } from "@/components/shell/fab-button";
import { TAB_ITEMS, isNavActive } from "@/components/shell/nav-items";

interface BottomTabBarProps {
  hrefFor: (path: string) => string;
  onNew: () => void;
}

/** Mobile: the reference's dark floating pill bar, with the + in the mood color. */
export function BottomTabBar({ hrefFor, onNew }: BottomTabBarProps) {
  const pathname = usePathname();
  const [today, entries, stats, calendar, more] = TAB_ITEMS;

  const tab = (item: (typeof TAB_ITEMS)[number]) => {
    const active = isNavActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={hrefFor(item.href)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors",
          active ? "text-mood-500" : "text-cream/60 hover:text-cream",
        )}
      >
        <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden />
        <span className="max-[379px]:sr-only">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-30 md:hidden"
    >
      <div className="mx-auto flex h-[64px] max-w-[520px] items-center gap-0.5 rounded-full bg-[#1c1c1a] px-2 shadow-[0_10px_30px_rgb(0_0_0/0.25)] ring-1 ring-white/10">
        {tab(today)}
        {tab(entries)}
        <div className="flex shrink-0 justify-center px-1">
          <FabButton onClick={onNew} />
        </div>
        {tab(stats)}
        {tab(calendar)}
        {tab(more)}
      </div>
    </nav>
  );
}

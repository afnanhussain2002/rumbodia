"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { FabButton } from "@/components/shell/fab-button";
import { TAB_ITEMS } from "@/components/shell/nav-items";

interface BottomTabBarProps {
  hrefFor: (path: string) => string;
  onNew: () => void;
}

export function BottomTabBar({ hrefFor, onNew }: BottomTabBarProps) {
  const pathname = usePathname();
  const [first, second, third, fourth] = TAB_ITEMS;

  const tab = (item: (typeof TAB_ITEMS)[number]) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={hrefFor(item.href)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold sm:text-[13px]",
          active ? "text-on-brand" : "text-on-brand/65",
        )}
      >
        <Icon size={22} strokeWidth={2} aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 bg-brand pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-[720px] items-center px-2 sm:px-6">
        {tab(first)}
        {tab(second)}
        <div className="flex flex-1 justify-center">
          <FabButton onClick={onNew} />
        </div>
        {tab(third)}
        {tab(fourth)}
      </div>
    </nav>
  );
}

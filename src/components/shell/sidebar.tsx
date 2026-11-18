"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ADMIN_ITEM, SIDEBAR_ITEMS, isNavActive } from "@/components/shell/nav-items";
import { useIsAdmin } from "@/features/admin/hooks/use-admin";
import { Rumbo } from "@/features/mascot/rumbo";
import { TrialPill } from "@/features/billing/components/paywall";
import { useCurrentMood } from "@/features/theme/use-current-mood";

interface SidebarProps {
  hrefFor: (path: string) => string;
  onNew: () => void;
}

/** Desktop: 240px with labels. Tablet (768–1023px): 72px, icons only. */
export function Sidebar({ hrefFor, onNew }: SidebarProps) {
  const pathname = usePathname();
  const mood = useCurrentMood();
  const level = mood?.level ?? null;
  const isAdmin = useIsAdmin();
  const items = isAdmin ? [...SIDEBAR_ITEMS, ADMIN_ITEM] : SIDEBAR_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center border-r border-line bg-bg/70 px-2 py-5 backdrop-blur-md md:flex lg:w-[240px] lg:items-stretch lg:px-4 2xl:w-[260px]">
      <div className="mb-8 flex items-center justify-between gap-2 lg:px-1">
        <Link href="/" className="inline-flex rounded-xl" aria-label="Rumbodia home">
          <span className="hidden lg:inline-flex">
            <Logo size={34} />
          </span>
          <span className="lg:hidden">
            <LogoMark size={36} />
          </span>
        </Link>
        {/* Tiny Rumbo that always shows the current mood */}
        <span
          className="hidden lg:inline-flex"
          title={level ? `Your mood: ${level.name}` : "No updates yet today"}
        >
          <Rumbo
            level={level?.key ?? "steady"}
            size={34}
            animated
            color="var(--mood-500)"
            label={level ? `Current mood: ${level.name}` : "Current mood: not set yet"}
          />
        </span>
      </div>

      <nav aria-label="Main" className="flex flex-col items-center gap-1 lg:items-stretch">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-full text-[15px] font-semibold transition-colors",
                "size-11 justify-center lg:size-auto lg:justify-start lg:px-4",
                active ? "bg-mood-500 text-mood-ink" : "text-ink-soft hover:bg-mood-100 hover:text-ink",
              )}
            >
              <Icon size={20} aria-hidden className="shrink-0" />
              <span className="sr-only lg:not-sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3 lg:items-stretch">
        <TrialPill />
        <button
          type="button"
          onClick={onNew}
          aria-keyshortcuts="N"
          aria-label="New update"
          className="btn-pop inline-flex size-12 items-center justify-center gap-2 rounded-full bg-mood-500 font-semibold text-mood-ink lg:h-12 lg:w-full"
        >
          <Plus size={20} strokeWidth={2.6} aria-hidden />
          <span className="hidden lg:inline">New update</span>
          <kbd className="ml-1 hidden rounded-md bg-black/10 px-1.5 text-[12px] font-bold lg:inline">N</kbd>
        </button>
        <Link href="/app/more/settings#about" className="hidden px-2 text-[13px] font-medium text-ink-soft hover:text-ink lg:block">
          About Rumbodia
        </Link>
      </div>
    </aside>
  );
}

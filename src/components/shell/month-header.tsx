"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { formatMonthTitle, monthKeyToDate } from "@/lib/utils/date";

const formatMonthShort = (key: string) =>
  monthKeyToDate(key).toLocaleDateString("en-US", { month: "short", year: "numeric" });
import { UserMenu } from "@/components/auth/user-menu";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SearchPanel } from "@/features/entries/components/search-panel";

interface MonthHeaderProps {
  /** null = not a month page; show `title` instead of month controls. */
  month: string | null;
  title?: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSearch: () => void;
  onNew: () => void;
}

export function MonthHeader({ month, title, canGoNext, onPrev, onNext, onSearch, onNew }: MonthHeaderProps) {
  const heading = month ? formatMonthTitle(month) : (title ?? "");
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[720px] items-center gap-1 px-4 min-[400px]:gap-2 sm:px-6 lg:max-w-[1100px] lg:px-8 2xl:max-w-[1240px]">
        {/* Mobile/tablet: logo links home. */}
        <Link href="/" aria-label="Rumbodia home" className="-ml-1 inline-flex size-11 items-center justify-center md:hidden">
          <LogoMark size={30} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 min-[400px]:gap-2 lg:justify-start">
          {month ? (
            <>
              <IconButton label="Previous month" variant="outline" onClick={onPrev} aria-keyshortcuts="ArrowLeft" className="size-10 lg:size-10">
                <ChevronLeft size={20} aria-hidden />
              </IconButton>
              <h1 className="page-title min-w-0 truncate text-center tabular lg:min-w-[190px] lg:px-1" aria-live="polite">
                <span className="max-[399px]:hidden">{heading}</span>
                <span className="min-[400px]:hidden">{formatMonthShort(month)}</span>
              </h1>
              <IconButton
                label="Next month"
                variant="outline"
                onClick={onNext}
                disabled={!canGoNext}
                aria-keyshortcuts="ArrowRight"
                className="size-10 lg:size-10"
              >
                <ChevronRight size={20} aria-hidden />
              </IconButton>
            </>
          ) : (
            <h1 className="page-title truncate">{heading}</h1>
          )}
        </div>

        {/* Mobile/tablet: search icon. Desktop: inline search + New update. */}
        <IconButton label="Search updates" onClick={onSearch} className="-mr-1 lg:hidden">
          <Search size={22} aria-hidden />
        </IconButton>
        <div className="hidden items-center gap-3 lg:flex">
          <SearchPanel inline />
          <Button onClick={onNew} icon={<Plus size={18} aria-hidden />} aria-keyshortcuts="N" className="btn-pop">
            New update
          </Button>
        </div>
        <div className="ml-1 flex size-9 shrink-0 items-center justify-center lg:ml-0">
          <UserMenu size={32} />
        </div>
      </div>
    </header>
  );
}

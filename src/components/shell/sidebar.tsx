"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SIDEBAR_ITEMS } from "@/components/shell/nav-items";

interface SidebarProps {
  hrefFor: (path: string) => string;
  onNew: () => void;
}

export function Sidebar({ hrefFor, onNew }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-line bg-card px-4 py-5 lg:flex 2xl:w-[260px]">
      <Link href="/" className="mb-8 inline-flex rounded-xl px-2 py-1" aria-label="Rumbodia home">
        <Logo size={34} />
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold transition-colors",
                active ? "bg-brand-soft text-brand-strong" : "text-ink-soft hover:bg-bg hover:text-ink",
              )}
            >
              <Icon size={20} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <Button onClick={onNew} className="w-full" icon={<Plus size={18} aria-hidden />} aria-keyshortcuts="N">
          New update
        </Button>
        <Link href="/app/more/settings#about" className="block px-2 text-[13px] font-medium text-ink-soft hover:text-ink">
          About Rumbodia
        </Link>
      </div>
    </aside>
  );
}

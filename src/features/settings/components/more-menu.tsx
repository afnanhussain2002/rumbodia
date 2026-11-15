"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Database, Settings, Target } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Card } from "@/components/ui/card";
import { AboutCard } from "@/features/settings/components/settings-form";

const ROWS = [
  { href: "/app/more/goals", label: "Goals", hint: "What Gemini scores against", icon: Target },
  { href: "/app/more/settings", label: "Settings", hint: "Theme, week start, parts of the day", icon: Settings },
  { href: "/app/more/data", label: "Your data", hint: "Export, import, delete", icon: Database },
];

export function MoreMenu() {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  // On desktop these items live in the sidebar, so there is no More page.
  useEffect(() => {
    if (isDesktop) router.replace("/app/more/goals");
  }, [isDesktop, router]);

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <Card className="p-2 lg:p-2">
        <ul className="divide-y divide-line">
          {ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.href}>
                <Link href={row.href} className="flex min-h-16 items-center gap-3 rounded-[14px] px-3 hover:bg-bg">
                  <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand-strong">
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">{row.label}</span>
                    <span className="block truncate text-[13px] text-ink-soft">{row.hint}</span>
                  </span>
                  <ChevronRight size={20} className="text-ink-soft" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
      <AboutCard />
    </div>
  );
}

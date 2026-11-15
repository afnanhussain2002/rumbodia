import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { Providers } from "@/components/shell/providers";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Your log" };

function ShellFallback() {
  return (
    <div className="mx-auto max-w-[720px] space-y-4 px-4 pt-20 lg:max-w-[1100px]" role="status" aria-label="Loading Rumbodia">
      <Skeleton className="h-40 rounded-[20px]" />
      <Skeleton className="h-72 rounded-[20px]" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Suspense fallback={<ShellFallback />}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </Providers>
  );
}

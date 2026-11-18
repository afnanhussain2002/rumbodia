"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { applyTheme, useSettings } from "@/features/settings/hooks/use-settings";
import { MoodProvider } from "@/features/theme/mood-provider";

/** Keeps <html data-theme> in sync with the saved setting. */
function ThemeSync() {
  const settings = useSettings();
  useEffect(() => {
    if (settings.isLoaded) applyTheme(settings.theme);
  }, [settings.isLoaded, settings.theme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ThemeSync />
        <MoodProvider />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}

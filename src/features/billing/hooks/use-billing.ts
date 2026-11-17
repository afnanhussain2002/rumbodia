"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, PAYWALL_EVENT } from "@/lib/api-client";
import type { PlanId } from "@/lib/billing";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";

/** The user's trial / plan. Refreshes when any request is refused with 402. */
export function useBilling() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.billing, queryFn: api.getBilling, staleTime: 5 * 60_000 });

  useEffect(() => {
    const refresh = () => void qc.invalidateQueries({ queryKey: queryKeys.billing });
    window.addEventListener(PAYWALL_EVENT, refresh);
    return () => window.removeEventListener(PAYWALL_EVENT, refresh);
  }, [qc]);

  return query;
}

/** Sends the browser to Stripe Checkout for a plan. */
export function useCheckout() {
  const toast = useToast();
  return useMutation({
    mutationFn: (plan: PlanId) => api.startCheckout(plan),
    onSuccess: (url) => window.location.assign(url),
    onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
  });
}

/** Sends the browser to the Stripe billing portal (cancel, switch plan, card, invoices). */
export function useBillingPortal() {
  const toast = useToast();
  return useMutation({
    mutationFn: () => api.openBillingPortal(),
    onSuccess: (url) => window.location.assign(url),
    onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
  });
}

export function daysLeft(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now) / (24 * 60 * 60 * 1000)));
}

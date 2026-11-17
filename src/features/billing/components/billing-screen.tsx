"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { api } from "@/lib/api-client";
import { PLANS, TRIAL_DAYS, type BillingStatus } from "@/lib/billing";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PlanCards, PromoBanner } from "@/features/billing/components/plan-cards";
import { daysLeft, useBilling, useBillingPortal, useCheckout } from "@/features/billing/hooks/use-billing";

const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

function statusText(b: BillingStatus): { title: string; body: string } {
  if (b.plan === "lifetime") return { title: "Lifetime", body: "You own Rumbodia for life. Thank you!" };
  if (b.state === "active" && b.plan) {
    const name = PLANS[b.plan].name;
    if (b.pastDue) return { title: name, body: "Your last payment failed. Update your card in Manage billing to keep access." };
    if (b.cancelAtPeriodEnd && b.currentPeriodEnd) return { title: name, body: `Canceled. You have access until ${date(b.currentPeriodEnd)}.` };
    return { title: name, body: b.currentPeriodEnd ? `Renews on ${date(b.currentPeriodEnd)}.` : "Active." };
  }
  if (b.state === "trial") {
    const d = daysLeft(b.trialEndsAt);
    return { title: "Free trial", body: `${d} day${d === 1 ? "" : "s"} left (ends ${date(b.trialEndsAt)}). No card needed until then.` };
  }
  return { title: "Trial ended", body: `Your ${TRIAL_DAYS}-day free trial is over. Pick a plan below to keep logging. Your data is safe.` };
}

export function BillingScreen() {
  const billing = useBilling();
  const checkout = useCheckout();
  const portal = useBillingPortal();
  const confirming = useConfirmReturn();

  if (billing.isPending || confirming) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading your plan">
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    );
  }
  if (billing.isError) {
    return (
      <Card>
        <p className="text-danger">{(billing.error as Error).message}</p>
      </Card>
    );
  }

  const b = billing.data;
  const text = statusText(b);
  return (
    <div className="space-y-5">
      <Card aria-labelledby="plan-title">
        <CardHeader title={text.title} titleId="plan-title" subtitle="Your plan" />
        <p className="text-[15px]">{text.body}</p>
        {b.canManage && b.plan !== null && (
          <Button
            variant="secondary"
            className="mt-4"
            icon={<CreditCard size={18} aria-hidden />}
            loading={portal.isPending}
            onClick={() => portal.mutate()}
          >
            Manage billing
          </Button>
        )}
      </Card>

      {b.plan !== "lifetime" && (
        <>
          <PromoBanner />
          <PlanCards
            onPick={(plan) => checkout.mutate(plan)}
            busyPlan={checkout.isPending ? (checkout.variables ?? null) : null}
            currentPlan={b.state === "active" ? b.plan : null}
            hasActivePlan={b.state === "active"}
          />
          <p className="text-center text-[13px] text-ink-soft">
            Secure payment by Stripe. {b.state === "trial" && "Pay during your trial and the free days you have left still count."}
          </p>
        </>
      )}
    </div>
  );
}

/** After Stripe sends the user back: confirm the session (so access unlocks right away), then clean the URL. */
function useConfirmReturn(): boolean {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const sessionId = params.get("session_id");
  const canceled = params.get("canceled");
  const [busy, setBusy] = useState(Boolean(sessionId));
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (canceled) {
      done.current = true;
      toast.show({ message: "Checkout canceled. You have not been charged." });
      router.replace("/app/billing", { scroll: false });
      return;
    }
    if (!sessionId) return;
    done.current = true;
    api
      .confirmCheckout(sessionId)
      .then((billing) => {
        qc.setQueryData(queryKeys.billing, billing);
        toast.show({ message: billing.state === "active" ? "Payment received. Thank you!" : "Payment is processing." });
      })
      .catch((err: Error) => toast.show({ message: err.message, tone: "error" }))
      .finally(() => {
        setBusy(false);
        router.replace("/app/billing", { scroll: false });
      });
  }, [sessionId, canceled, qc, router, toast]);

  return busy;
}

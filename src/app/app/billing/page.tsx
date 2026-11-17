import type { Metadata } from "next";
import { BillingScreen } from "@/features/billing/components/billing-screen";

export const metadata: Metadata = { title: "Plan & billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-[960px]">
      <BillingScreen />
    </div>
  );
}

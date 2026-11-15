import type { Metadata } from "next";
import { DataScreen } from "@/features/data/components/data-screen";

export const metadata: Metadata = { title: "Your data" };

export default function DataPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <DataScreen />
    </div>
  );
}

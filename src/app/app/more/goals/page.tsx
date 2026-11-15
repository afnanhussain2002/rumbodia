import type { Metadata } from "next";
import { GoalsEditor } from "@/features/goals/components/goals-editor";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <GoalsEditor />
    </div>
  );
}

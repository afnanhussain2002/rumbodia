import type { Metadata } from "next";
import { MoreMenu } from "@/features/settings/components/more-menu";

export const metadata: Metadata = { title: "More" };

export default function MorePage() {
  return <MoreMenu />;
}

import type { Metadata } from "next";
import { StatsScreen } from "@/features/stats/components/stats-screen";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <StatsScreen />;
}

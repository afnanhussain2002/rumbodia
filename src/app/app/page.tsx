import type { Metadata } from "next";
import { TodayScreen } from "@/features/today/components/today-screen";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <TodayScreen />;
}

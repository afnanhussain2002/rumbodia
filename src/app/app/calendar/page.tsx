import type { Metadata } from "next";
import { CalendarScreen } from "@/features/calendar/components/calendar-screen";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return <CalendarScreen />;
}

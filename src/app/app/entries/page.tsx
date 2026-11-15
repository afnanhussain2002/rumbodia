import type { Metadata } from "next";
import { EntriesScreen } from "@/features/entries/components/entries-screen";

export const metadata: Metadata = { title: "Entries" };

export default function EntriesPage() {
  return <EntriesScreen />;
}

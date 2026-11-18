import type { Metadata } from "next";
import { getAdminIdentity } from "@/server/admin/auth";
import { Card } from "@/components/ui/card";
import { AdminScreen } from "@/features/admin/components/admin-screen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Access is decided here on the server from ADMIN_EMAILS, and every /api/admin route checks again,
 * so the hidden nav link is convenience, not the security boundary.
 */
export default async function AdminPage() {
  const admin = await getAdminIdentity();
  if (!admin) {
    return (
      <Card className="mx-auto mt-10 max-w-[480px]">
        <h1 className="text-[20px] font-bold">No admin access</h1>
        <p className="mt-2 text-[15px] text-ink-soft">This page is only for Rumbodia admins.</p>
      </Card>
    );
  }
  return <AdminScreen email={admin.email} />;
}

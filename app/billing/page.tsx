import { BillingDashboardClient } from "@/components/billing/BillingDashboardClient";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { CoreShell } from "@/components/core/CoreShell";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Billing | MapAble",
  description: "Participant billing dashboard",
};

export default async function BillingPage() {
  await requireAuth();

  return (
    <CoreShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <CorePageHeader
          title="Billing"
          description="View invoices, funding sources, and pay securely via Stripe Checkout. Plan-managed NDIS invoices are exported to your plan manager — never charged on card."
        />
        <BillingDashboardClient />
      </div>
    </CoreShell>
  );
}

import { BillingDashboardClient } from "@/components/billing/BillingDashboardClient";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Billing | MapAble",
  description: "Participant billing dashboard — NDIS-aware invoices and secure payments",
};

export default async function BillingPage() {
  return (
    <div className={`${mapablePageContainerClass} py-10 sm:py-14`}>
      <div className="mx-auto max-w-3xl">
        <CorePageHeader
          centered
          eyebrow="NDIS billing"
          title={
            <>
              Your <span className="text-primary">invoices</span> &{" "}
              <span className="text-secondary">payments</span>
            </>
          }
          description="View invoices, funding sources, and pay securely via Stripe Checkout. Plan-managed NDIS invoices are exported to your plan manager — never charged on card."
        />
        <div className="mt-10">
          <BillingDashboardClient />
        </div>
      </div>
    </div>
  );
}

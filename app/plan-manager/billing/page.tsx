import { Suspense } from "react";

import { PlanManagerBillingClient } from "@/components/billing/PlanManagerBillingClient";

export const metadata = {
  title: "Billing | Plan Manager",
  description: "Plan Manager Office subscription and AbilityPay export quotas.",
};

export default function PlanManagerBillingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading billing…</div>}>
      <PlanManagerBillingClient />
    </Suspense>
  );
}

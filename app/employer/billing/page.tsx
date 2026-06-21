import { Suspense } from "react";

import { EmployerBillingClient } from "@/components/billing/EmployerBillingClient";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Employer billing | MapAble",
};

export default function EmployerBillingPage() {
  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Employer console
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Billing & <span className="text-primary">subscriptions</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Manage your Employer Pro subscription and billing via Stripe.
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading billing…</p>}>
            <EmployerBillingClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

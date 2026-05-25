"use client";

import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";
import { ClaimValidationSummary } from "@/components/plan-manager/ClaimValidationSummary";
import { ServiceEvidencePanel } from "@/components/plan-manager/ServiceEvidencePanel";
import { PaymentStatusUpdater } from "@/components/plan-manager/PaymentStatusUpdater";
import { PlanManagerDisputePanel } from "@/components/plan-manager/PlanManagerDisputePanel";

export function InvoiceReviewPanel({
  invoiceId,
  invoice,
  claimWarnings,
  serviceLogs,
  payment,
  disclaimer,
}: {
  invoiceId: string;
  invoice: {
    status: string;
    totalCents: number;
    lines: { description: string; supportItemCode?: string | null }[];
    organisation?: { name: string } | null;
  };
  claimWarnings: string[];
  serviceLogs: { id: string; bookingType: string; status: string; requestedStart: Date | string }[];
  payment?: { status: string } | null;
  disclaimer: string;
}) {
  return (
    <div className="space-y-6">
      <MapAbleCard title="Invoice review">
        <p className="text-sm text-muted-foreground">{disclaimer}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Provider</dt>
            <dd>{invoice.organisation?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Total</dt>
            <dd>${(invoice.totalCents / 100).toFixed(2)}</dd>
          </div>
          <div>
            <dt className="font-medium">Status</dt>
            <dd>
              <MapAbleStatusBadge status={invoice.status} />
            </dd>
          </div>
          {payment ? (
            <div>
              <dt className="font-medium">Payment</dt>
              <dd>
                <MapAbleStatusBadge status={payment.status} />
              </dd>
            </div>
          ) : null}
        </dl>
      </MapAbleCard>
      <ClaimValidationSummary warnings={claimWarnings} />
      <ServiceEvidencePanel serviceLogs={serviceLogs} />
      <PaymentStatusUpdater invoiceId={invoiceId} />
      <PlanManagerDisputePanel invoiceId={invoiceId} />
    </div>
  );
}

"use client";

import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function FamilyInvoiceApprovalPanel({
  invoiceId,
  participantId,
  linkId,
}: {
  invoiceId: string;
  participantId: string;
  linkId: string;
}) {
  async function approve() {
    await fetch(`/api/family/invoices/${invoiceId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, linkId }),
    });
  }

  return (
    <MapAbleCard title="Invoice approval request">
      <p className="text-sm text-muted-foreground">
        You can approve on behalf of the participant where this permission is granted.
        Final funding decisions remain with the participant and plan manager.
      </p>
      <button
        type="button"
        onClick={approve}
        className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        Approve for participant review
      </button>
      <p className="mt-2 text-xs">
        <MapAbleStatusBadge status="pending_review" />
      </p>
    </MapAbleCard>
  );
}

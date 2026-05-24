"use client";

import { InvoiceApprovalPanel } from "@/components/invoices/InvoiceApprovalPanel";
import { InvoiceDisputePanel } from "@/components/invoices/InvoiceDisputePanel";
import { InvoiceLineItems } from "@/components/invoices/InvoiceLineItems";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { StripePaymentButton } from "@/components/invoices/StripePaymentButton";
import { XeroSyncStatus } from "@/components/invoices/XeroSyncStatus";
import { Button } from "@/components/ui/button";

type InvoiceData = {
  id: string;
  invoiceNumber?: string | null;
  status: string;
  totalCents: number;
  privatePayCents?: number | null;
  participantId: string;
  organisationId?: string | null;
  requiresParticipantApproval: boolean;
  lines: Array<{
    id: string;
    description: string;
    plainDescription?: string | null;
    serviceDate: string;
    quantity: number | string;
    unitAmountCents: number;
    totalAmountCents: number;
    supportItemCode?: string | null;
    claimableByNdis?: boolean;
  }>;
};

export function InvoiceDetail({
  invoice,
  viewerRole,
  currentUserId,
}: {
  invoice: InvoiceData;
  viewerRole: "participant" | "provider";
  currentUserId: string;
}) {
  const isParticipant = invoice.participantId === currentUserId;
  const payAmount = invoice.privatePayCents ?? invoice.totalCents;
  const canPay =
    isParticipant &&
    ["issued", "approved", "payment_pending", "partially_paid"].includes(
      invoice.status
    );
  const canApprove =
    isParticipant && invoice.status === "awaiting_participant_approval";

  return (
    <article className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold">
            Invoice {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="mt-2 text-lg font-medium">
          Total: ${(invoice.totalCents / 100).toFixed(2)} AUD
        </p>
      </header>

      <InvoiceLineItems
        lines={invoice.lines}
        audience={viewerRole === "participant" ? "participant" : "provider"}
      />

      {canApprove ? (
        <InvoiceApprovalPanel invoiceId={invoice.id} canApprove />
      ) : null}

      {canPay ? (
        <StripePaymentButton invoiceId={invoice.id} amountCents={payAmount} />
      ) : null}

      {isParticipant && invoice.status !== "void" ? (
        <InvoiceDisputePanel invoiceId={invoice.id} />
      ) : null}

      {viewerRole === "provider" && invoice.organisationId ? (
        <div className="space-y-4">
          <XeroSyncStatus invoiceId={invoice.id} canRetry />
          {invoice.status === "draft" ? (
            <ProviderActions invoiceId={invoice.id} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ProviderActions({ invoiceId }: { invoiceId: string }) {
  async function issue() {
    await fetch(`/api/invoices/${invoiceId}/issue`, { method: "POST" });
    window.location.reload();
  }

  return (
    <Button type="button" variant="default" size="default" onClick={() => void issue()}>
      Issue invoice to participant
    </Button>
  );
}

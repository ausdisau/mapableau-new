"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InvoiceValidationResult } from "@/types/abilitypay";
import type { AbilityPayFundingModel } from "@prisma/client";

import { AiSuggestionPanel } from "./AiSuggestionPanel";
import { ConsentGate } from "./ConsentGate";
import { DuplicateInvoiceWarning } from "./DuplicateInvoiceWarning";
import { InvoiceLineItemTable } from "./InvoiceLineItemTable";
import { InvoicePaymentActions } from "./InvoicePaymentActions";
import { ParticipantApprovalButtons } from "./ParticipantApprovalButtons";
import { PriceGuardBadge } from "./PriceGuardBadge";
import { formatCents, formatInvoiceStatus } from "./utils";

type InvoiceData = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  paymentStatus: string;
  fundingModel: AbilityPayFundingModel | null;
  totalCents: number;
  validationJson: unknown;
  provider?: { legalName: string; abn: string | null } | null;
  lineItems: Parameters<typeof InvoiceLineItemTable>[0]["lines"];
  riskFlags?: { flagType: string; message: string }[];
  paymentAttempts?: {
    id: string;
    adapter: string;
    status: string;
    externalRef: string | null;
  }[];
};

export function InvoiceReviewPanel({
  invoice,
  canApprove,
  canPay,
  canConfirmPayment,
  showAiAssist,
}: {
  invoice: InvoiceData;
  canApprove: boolean;
  canPay: boolean;
  canConfirmPayment: boolean;
  showAiAssist: boolean;
}) {
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const validation = invoice.validationJson as InvoiceValidationResult | null;
  const hasDuplicate = invoice.riskFlags?.some((f) => f.flagType === "duplicate");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {invoice.invoiceNumber ?? "Draft invoice"}
          </CardTitle>
          <CardDescription>
            {invoice.provider?.legalName ?? "No provider"}
            {invoice.provider?.abn ? ` · ABN ${invoice.provider.abn}` : ""} ·{" "}
            {formatCents(invoice.totalCents)} ·{" "}
            {formatInvoiceStatus(invoice.status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DuplicateInvoiceWarning show={!!hasDuplicate} />
          {validation ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Validation checks</p>
              <PriceGuardBadge status={validation.checks.priceLimitStatus} />
              {validation.failedReasons.length > 0 ? (
                <ul className="list-inside list-disc text-sm text-destructive">
                  {validation.failedReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">All checks passed.</p>
              )}
            </div>
          ) : null}
          <InvoiceLineItemTable lines={invoice.lineItems} />
        </CardContent>
      </Card>

      {invoice.status === "awaiting_participant" && canApprove ? (
        <>
          <ConsentGate
            onConfirm={() => setConsentConfirmed(true)}
            disabled={consentConfirmed}
          />
          <ParticipantApprovalButtons
            invoiceId={invoice.id}
            canApprove={canApprove}
            consentConfirmed={consentConfirmed}
          />
        </>
      ) : null}

      <InvoicePaymentActions
        invoiceId={invoice.id}
        invoiceStatus={invoice.status}
        paymentStatus={invoice.paymentStatus}
        fundingModel={invoice.fundingModel}
        totalCents={invoice.totalCents}
        canPay={canPay}
        canConfirmPayment={canConfirmPayment}
        paymentAttempts={invoice.paymentAttempts ?? []}
      />

      {showAiAssist ? <AiSuggestionPanel invoiceId={invoice.id} /> : null}
    </div>
  );
}

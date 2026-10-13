import type {
  AgenticInvoiceDraft,
  GuardrailDecision,
  ParticipantBillingSummary,
} from "@/server/billing/billingTypes";

function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return currency === "AUD" ? `$${amount} AUD` : `${amount} ${currency}`;
}

export function buildParticipantBillingSummary(
  draft: AgenticInvoiceDraft,
  guardrailDecision: GuardrailDecision
): ParticipantBillingSummary {
  const lineSummaries = draft.lineItems.map((line) => ({
    lineId: line.id,
    bookingId: line.bookingId,
    description: line.description,
    totalAmountCents: line.totalAmountCents,
    evidenceSummary: line.evidence.summary,
  }));

  const totalLabel = formatMoney(draft.totalCents, draft.currency);
  const statusNote =
    draft.status === "disputed"
      ? "You have disputed this draft. A team member will review it before anything is sent."
      : guardrailDecision.overallStatus === "blocked"
        ? "This draft cannot proceed until issues listed in the review are resolved."
        : guardrailDecision.overallStatus === "requires_human_review"
          ? "This draft needs a finance or support review before you can approve it."
          : "Review the line items and evidence links, then approve when you are satisfied.";

  const plainLanguageSummary = [
    `Invoice draft ${draft.id.slice(0, 8)}… for ${lineSummaries.length} service line(s).`,
    `Total: ${totalLabel}. Funding context: ${draft.fundingContext.replace(/_/g, " ")}.`,
    statusNote,
    "MapAble does not submit NDIS claims or send invoices without your explicit approval.",
  ].join(" ");

  const nextSteps: string[] = [
    "Review each line item and its linked booking evidence.",
    "Approve the draft when amounts and services match what you received.",
  ];

  if (draft.status === "disputed") {
    nextSteps.unshift("Wait for human review after your dispute.");
  } else if (guardrailDecision.blockReasons.length) {
    nextSteps.unshift(
      `Resolve: ${guardrailDecision.blockReasons.join("; ")}`
    );
  }

  if (guardrailDecision.checks.some((c) => c.id === "unusual_price_requires_review" && c.status === "review")) {
    nextSteps.push("A finance reviewer may contact you about unusual line pricing.");
  }

  return {
    invoiceId: draft.id,
    participantId: draft.participantId,
    status: draft.status,
    fundingContext: draft.fundingContext,
    lineCount: draft.lineItems.length,
    totalCents: draft.totalCents,
    currency: draft.currency,
    plainLanguageSummary,
    lineSummaries,
    requiresYourApproval: true,
    canSendOrSubmit: false,
    nextSteps,
  };
}

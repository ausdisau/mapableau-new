import { descriptionsContainSensitiveWords } from "@/lib/billing/preflight";
import type {
  AgenticInvoiceDraft,
  BillingGuardrailId,
  GuardrailCheckResult,
  GuardrailDecision,
} from "@/server/billing/billingTypes";

/** MVP threshold: line unit price above this triggers human review (AUD cents). */
const UNUSUAL_UNIT_PRICE_CENTS = 500_00;

const ALL_GUARDRAIL_IDS: BillingGuardrailId[] = [
  "billing_requires_service_evidence",
  "participant_can_view_billing_summary",
  "disputed_invoice_requires_human_review",
  "billing_minimum_necessary_information",
  "no_auto_claim_submission",
  "unusual_price_requires_review",
];

export function evaluateBillingGuardrails(
  draft: AgenticInvoiceDraft
): GuardrailDecision {
  const checks: GuardrailCheckResult[] = [];
  const blockReasons: string[] = [];

  const missingEvidence = draft.lineItems.filter(
    (li) => li.evidence.evidenceIds.length === 0
  );
  const evidencePass = missingEvidence.length === 0;
  checks.push({
    id: "billing_requires_service_evidence",
    status: evidencePass ? "pass" : "fail",
    message: evidencePass
      ? "Each line item is linked to service evidence from confirmed bookings."
      : `Missing service evidence for booking(s): ${missingEvidence.map((l) => l.bookingId).join(", ")}.`,
  });
  if (!evidencePass) {
    blockReasons.push("Service evidence is required before billing approval.");
  }

  checks.push({
    id: "participant_can_view_billing_summary",
    status: "pass",
    message:
      "A participant-facing billing summary is generated; no clinical or safeguarding detail is included.",
  });

  const isDisputed = draft.status === "disputed";
  checks.push({
    id: "disputed_invoice_requires_human_review",
    status: isDisputed ? "review" : "pass",
    message: isDisputed
      ? "This invoice is disputed and must be reviewed by a human before any send or submit action."
      : "No active dispute on this invoice.",
  });
  if (isDisputed) {
    blockReasons.push("Invoice is disputed — human review required.");
  }

  const descriptions = draft.lineItems.map((li) => li.description);
  const sensitive = descriptionsContainSensitiveWords(descriptions);
  checks.push({
    id: "billing_minimum_necessary_information",
    status: sensitive ? "fail" : "pass",
    message: sensitive
      ? "Invoice descriptions must not include diagnosis, medication, or other unnecessary clinical detail."
      : "Line descriptions use minimum necessary billing information only.",
  });
  if (sensitive) {
    blockReasons.push("Descriptions contain disallowed sensitive terms.");
  }

  checks.push({
    id: "no_auto_claim_submission",
    status: "pass",
    message:
      "Automatic NDIS claim submission is disabled in this MVP. Invoices and claims require explicit human or participant approval.",
  });

  const unusualLines = draft.lineItems.filter(
    (li) => li.unitAmountCents >= UNUSUAL_UNIT_PRICE_CENTS
  );
  const unusual = unusualLines.length > 0;
  checks.push({
    id: "unusual_price_requires_review",
    status: unusual ? "review" : "pass",
    message: unusual
      ? `Unusual unit price on line(s): ${unusualLines.map((l) => l.id).join(", ")} — finance review recommended.`
      : "All line unit prices are within the usual review threshold.",
  });
  if (unusual) {
    blockReasons.push("Unusual pricing requires finance review.");
  }

  const hasFail = checks.some((c) => c.status === "fail");
  const hasReview = checks.some((c) => c.status === "review");

  let overallStatus: GuardrailDecision["overallStatus"];
  if (hasFail || isDisputed) {
    overallStatus = isDisputed ? "requires_human_review" : "blocked";
  } else if (hasReview) {
    overallStatus = "requires_human_review";
  } else {
    overallStatus = "approved_for_review";
  }

  const requiresApproval = true;

  return {
    evaluatedAt: new Date().toISOString(),
    overallStatus,
    checks,
    canSendOrSubmit: false,
    requiresApproval,
    blockReasons,
  };
}

export function guardrailIds(): BillingGuardrailId[] {
  return [...ALL_GUARDRAIL_IDS];
}

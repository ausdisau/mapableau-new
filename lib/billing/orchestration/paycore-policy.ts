/**
 * PayCore v0.1 — shared cross-vertical preparation policy, SYNTHETIC ONLY.
 *
 * No payment, refund, payout, NDIA claim or Xero document is created here.
 * Input must be assembled from server-authoritative MapAble records, NEVER
 * decoded directly from a browser. All branches return executable: false.
 *
 * Existing BillingInvoice, AbilityPay, Stripe and Xero systems stay authoritative
 * for their respective workflows. This module is not wired into live routes.
 */
export type PayCoreVertical = "marketplace" | "care" | "transport" | "jobs";

export type PayCoreSource =
  | { readonly vertical: "marketplace"; readonly type: "marketplace_transaction"; readonly ref: string }
  | { readonly vertical: "care"; readonly type: "care_shift" | "timesheet"; readonly ref: string }
  | { readonly vertical: "transport"; readonly type: "transport_trip"; readonly ref: string }
  | { readonly vertical: "jobs"; readonly type: "employment_session" | "subscription_period"; readonly ref: string };

export type PayCoreFunding =
  | "ndis_self_managed"
  | "ndis_plan_managed"
  | "ndis_agency_managed"
  | "private_card"
  | "private_pay"
  | "organisation_invoice"
  | "employer_funded"
  | "grant"
  | "grant_funded"
  | "mixed"
  | "home_care_package"
  | "insurance"
  | "other";

export type PayCoreRoute =
  | "psp_hosted_payment_preparation"
  | "plan_manager_invoice_export"
  | "ndia_provider_claim_preparation"
  | "organisation_receivable_invoice"
  | "manual_finance_review";

export type PayCoreHold =
  | "UNATTESTED_SOURCE"
  | "INVALID_AMOUNT"
  | "MISSING_EVIDENCE"
  | "PAYER_NOT_CONFIRMED"
  | "FEE_NOT_APPROVED"
  | "TAX_NOT_REVIEWED"
  | "VENDOR_NOT_VERIFIED"
  | "SERVICE_NOT_CONFIRMED"
  | "FUNDING_ROUTE_INCOMPATIBLE"
  | "REGULATORY_REVIEW"
  | "SOURCE_IN_DISPUTE";

export interface PayCoreCanonicalLine {
  readonly source: PayCoreSource;
  readonly quantity: number;
  readonly unitCents: number;
  /** Precalculated tax supplied by an authorised server pricing engine. */
  readonly taxCents: number | null;
  /** Fee charged to payer, if any, and already agreed separately. */
  readonly payerFeeCents: number;
  readonly evidenceStatus: "verified" | "missing" | "disputed";
}

export interface PayCoreVerifiedContext {
  /** Not customer-supplied. Repository/service must prove this attestation. */
  readonly serverAttested: boolean;
  readonly priceRevision: string;
  readonly organisationRef: string;
  readonly currency: "AUD";
  readonly lines: readonly PayCoreCanonicalLine[];
  readonly funding: PayCoreFunding;
  readonly payer: "participant" | "organisation";
  readonly payerApproval: "participant_confirmed" | "organisation_confirmed" | "missing";
  /** A server-owned, purpose-bound consent or procurement approval receipt. */
  readonly authorityReceiptRef: string | null;
  readonly feeApproved: boolean;
  readonly taxReviewed: boolean;
  readonly sellerApproved: boolean;
  readonly deliveryConfirmed: boolean;
  readonly disputeOpen: boolean;
  readonly requiresRegulatoryReview: boolean;
}

export interface PayCorePreparedInstruction {
  readonly status: "prepared" | "on_hold";
  readonly vertical: PayCoreVertical;
  readonly paymentRoute: PayCoreRoute;
  readonly totalCents: number;
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly payerFeeCents: number;
  readonly currency: "AUD";
  readonly holds: readonly PayCoreHold[];
  /** No live provider action permitted from this contract. */
  readonly executable: false;
  readonly ndiaClaimSubmitted: false;
  readonly fundsHeldByMapAble: false;
  readonly note: string;
}

const cents = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const money = (n: number): boolean => Number.isSafeInteger(n) && n >= 0 && n <= 1_000_000_000;
const oneSource = (lines: readonly PayCoreCanonicalLine[]): boolean =>
  lines.length > 0 && lines.length <= 25 &&
  lines.every((line) => line.source.vertical === lines[0].source.vertical);

export function fundingRouteFor(type: PayCoreFunding): PayCoreRoute {
  switch (type) {
    case "private_card":
    case "private_pay":
    case "ndis_self_managed":
      return "psp_hosted_payment_preparation";
    case "ndis_plan_managed":
      return "plan_manager_invoice_export";
    case "ndis_agency_managed":
      return "ndia_provider_claim_preparation";
    case "organisation_invoice":
    case "employer_funded":
      return "organisation_receivable_invoice";
    default:
      return "manual_finance_review";
  }
}

export function preparePayCoreInstruction(context: PayCoreVerifiedContext): PayCorePreparedInstruction {
  if (!oneSource(context.lines)) {
    throw new Error("One proposed instruction must contain 1–25 lines from the same MapAble vertical.");
  }
  const vertical = context.lines[0].source.vertical;
  const holds: PayCoreHold[] = [];
  const hold = (code: PayCoreHold) => {
    if (!holds.includes(code)) holds.push(code);
  };

  if (!context.serverAttested ||
      !context.priceRevision.trim() ||
      !context.organisationRef.trim() ||
      context.lines.some((line) => !line.source.ref.trim())) hold("UNATTESTED_SOURCE");

  let subtotal = 0, tax = 0, fees = 0;
  for (const line of context.lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 100 ||
        !money(line.unitCents) || (line.taxCents !== null && !cents(line.taxCents)) ||
        !cents(line.payerFeeCents)) {
      hold("INVALID_AMOUNT");
      continue;
    }
    const product = line.quantity * line.unitCents;
    if (!money(product)) hold("INVALID_AMOUNT");
    else subtotal += product;
    if (line.taxCents === null) hold("TAX_NOT_REVIEWED");
    else tax += line.taxCents;
    fees += line.payerFeeCents;
    if (line.evidenceStatus === "missing") hold("MISSING_EVIDENCE");
    if (line.evidenceStatus === "disputed") hold("SOURCE_IN_DISPUTE");
  }
  if (!money(subtotal) || !money(tax) || !money(fees) ||
      !money(subtotal + tax + fees)) hold("INVALID_AMOUNT");

  if (!context.feeApproved) hold("FEE_NOT_APPROVED");
  if (!context.taxReviewed) hold("TAX_NOT_REVIEWED");
  if (context.disputeOpen) hold("SOURCE_IN_DISPUTE");
  if (context.requiresRegulatoryReview) hold("REGULATORY_REVIEW");
  if (!context.authorityReceiptRef?.trim() || context.payerApproval === "missing" ||
      (context.payer === "participant" && context.payerApproval !== "participant_confirmed") ||
      (context.payer === "organisation" && context.payerApproval !== "organisation_confirmed"))
    hold("PAYER_NOT_CONFIRMED");

  if (vertical === "marketplace" && !context.sellerApproved) hold("VENDOR_NOT_VERIFIED");
  if ((vertical === "care" || vertical === "transport" ||
      context.lines.some((line) => line.source.type === "employment_session")) &&
      !context.deliveryConfirmed) hold("SERVICE_NOT_CONFIRMED");

  // Wage payroll must NOT enter this purchases-and-invoicing service.
  if (vertical === "jobs" && context.payer === "participant" &&
      context.funding === "employer_funded") hold("FUNDING_ROUTE_INCOMPATIBLE");

  const route = fundingRouteFor(context.funding);
  if (route === "organisation_receivable_invoice" && context.payer !== "organisation")
    hold("FUNDING_ROUTE_INCOMPATIBLE");
  // Employers may pay subscription/enterprise charges by card, and
  // organisations may buy Marketplace goods. This is NOT worker payroll.
  const approvedOrganisationCard =
    route === "psp_hosted_payment_preparation" &&
    context.payer === "organisation" &&
    (vertical === "marketplace" ||
      (vertical === "jobs" &&
        context.lines.every((line) => line.source.type === "subscription_period")));
  if (route === "psp_hosted_payment_preparation" &&
      context.payer !== "participant" && !approvedOrganisationCard)
    hold("FUNDING_ROUTE_INCOMPATIBLE");
  if ((route === "plan_manager_invoice_export" ||
       route === "ndia_provider_claim_preparation") && context.payer !== "participant")
    hold("FUNDING_ROUTE_INCOMPATIBLE");
  if (route === "manual_finance_review") hold("FUNDING_ROUTE_INCOMPATIBLE");
  if (route === "ndia_provider_claim_preparation") hold("REGULATORY_REVIEW");

  const status = holds.length ? "on_hold" : "prepared";
  return {
    status, vertical,
    paymentRoute: status === "prepared" ? route : "manual_finance_review",
    totalCents: status === "prepared" ? subtotal + tax + fees : 0,
    subtotalCents: status === "prepared" ? subtotal : 0,
    taxCents: status === "prepared" ? tax : 0,
    payerFeeCents: status === "prepared" ? fees : 0,
    currency: "AUD",
    holds,
    executable: false,
    ndiaClaimSubmitted: false,
    fundsHeldByMapAble: false,
    note:
      "Preparation only. Not a payment approval, NDIS claim, wage payment, invoice, " +
      "PSP settlement, stored-value balance or regulatory clearance.",
  };
}

export type PayCorePayoutHold =
  | "PAYMENT_NOT_RECONCILED"
  | "PROVIDER_NOT_VERIFIED"
  | "DISPUTE_OR_REFUND_PENDING"
  | "ATTESTATION_MISSING"
  | "CUSTODY_MODEL_UNAPPROVED";

export interface PayCorePayoutEvidence {
  readonly paymentSettledAndReconciled: boolean;
  readonly recipientOnboardingVerified: boolean;
  readonly disputeOrRefundOpen: boolean;
  readonly serviceAttestationPresent: boolean;
  readonly approvedLicensedRail: boolean;
}
export function assessPayoutReadiness(e: PayCorePayoutEvidence): {
  readonly allowedToTransfer: false;
  readonly issues: readonly PayCorePayoutHold[];
} {
  const issues: PayCorePayoutHold[] = [];
  if (!e.paymentSettledAndReconciled) issues.push("PAYMENT_NOT_RECONCILED");
  if (!e.recipientOnboardingVerified) issues.push("PROVIDER_NOT_VERIFIED");
  if (e.disputeOrRefundOpen) issues.push("DISPUTE_OR_REFUND_PENDING");
  if (!e.serviceAttestationPresent) issues.push("ATTESTATION_MISSING");
  if (!e.approvedLicensedRail) issues.push("CUSTODY_MODEL_UNAPPROVED");
  // Hard-disabled even if every prerequisite is present: human go-live required.
  return { allowedToTransfer: false, issues };
}

/** Downstream PSP event handling must use persisted deduplication, not this in-memory helper. */
export function classifyProviderEvent(args: {
  readonly eventId: string;
  readonly alreadyProcessed: boolean;
  readonly verifiedSignature: boolean;
  readonly expectedEnvironment: "test" | "live";
  readonly actualEnvironment: "test" | "live";
}): "reject" | "duplicate" | "process" {
  if (!args.verifiedSignature || args.expectedEnvironment !== args.actualEnvironment ||
      !args.eventId.trim()) return "reject";
  if (args.alreadyProcessed) return "duplicate";
  return "process";
}

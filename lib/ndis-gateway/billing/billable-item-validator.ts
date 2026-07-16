import type { NdisBillingRoute, NdisPaymentRoute } from "@prisma/client";

export type BillableValidationIssue = {
  code: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type BillableItemDraftInput = {
  billingRoute: NdisBillingRoute;
  ndisPaymentRoute?: NdisPaymentRoute | null;
  participantId?: string | null;
  supportItemCode?: string | null;
  serviceStartAt: Date | string;
  serviceEndAt: Date | string;
  unitPriceCents?: number | null;
  totalCents?: number | null;
  allowZeroPriceReason?: string | null;
  pricingProvenanceJson?: unknown;
  statusTarget?: "draft" | "ready";
};

export type BillableItemValidationResult = {
  valid: boolean;
  blockingIssues: BillableValidationIssue[];
  warnings: BillableValidationIssue[];
};

const NDIS_ROUTES: readonly NdisBillingRoute[] = [
  "ndis_self_managed",
  "ndis_plan_managed",
  "ndis_ndia_managed",
];

const ROUTES_REQUIRING_PRICING_PROVENANCE: readonly NdisBillingRoute[] = [
  "ndis_plan_managed",
  "ndis_ndia_managed",
];

function isNdisRoute(route: NdisBillingRoute): boolean {
  return NDIS_ROUTES.includes(route);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Pure validation for billable item drafts. Fail closed on PENDING_CODE / zero price.
 */
export function validateBillableItemDraft(
  input: BillableItemDraftInput
): BillableItemValidationResult {
  const blockingIssues: BillableValidationIssue[] = [];
  const warnings: BillableValidationIssue[] = [];

  const code = input.supportItemCode?.trim() ?? "";
  if (isNdisRoute(input.billingRoute)) {
    if (!code) {
      blockingIssues.push({
        code: "support_item_missing",
        field: "supportItemCode",
        message: "NDIS billing routes require a support item code.",
        severity: "error",
      });
    } else if (code.toUpperCase() === "PENDING_CODE") {
      blockingIssues.push({
        code: "pending_code_refused",
        field: "supportItemCode",
        message: "PENDING_CODE is not allowed on billable items.",
        severity: "error",
      });
    }

    if (!input.participantId?.trim()) {
      blockingIssues.push({
        code: "participant_required",
        field: "participantId",
        message: "NDIS billing routes require a participant.",
        severity: "error",
      });
    }
  }

  const start = toDate(input.serviceStartAt);
  const end = toDate(input.serviceEndAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    blockingIssues.push({
      code: "service_dates_invalid",
      field: "serviceStartAt",
      message: "Service start and end must be valid dates.",
      severity: "error",
    });
  } else if (end.getTime() < start.getTime()) {
    blockingIssues.push({
      code: "service_end_before_start",
      field: "serviceEndAt",
      message: "Service end must not be before service start.",
      severity: "error",
    });
  }

  const price = input.unitPriceCents;
  const isProBono = input.billingRoute === "pro_bono";
  const zeroAllowed =
    isProBono || Boolean(input.allowZeroPriceReason?.trim());

  if (price == null) {
    if (input.statusTarget === "ready" && isNdisRoute(input.billingRoute)) {
      blockingIssues.push({
        code: "unit_price_missing",
        field: "unitPriceCents",
        message: "Unit price is required before a billable item can become ready.",
        severity: "error",
      });
    }
  } else if (!Number.isInteger(price)) {
    blockingIssues.push({
      code: "unit_price_not_integer",
      field: "unitPriceCents",
      message: "Unit price must be integer cents.",
      severity: "error",
    });
  } else if (price < 0) {
    blockingIssues.push({
      code: "unit_price_negative",
      field: "unitPriceCents",
      message: "Unit price cannot be negative.",
      severity: "error",
    });
  } else if (price === 0 && !zeroAllowed) {
    blockingIssues.push({
      code: "zero_price_refused",
      field: "unitPriceCents",
      message:
        "Zero price is refused unless the route is pro_bono or allowZeroPriceReason is set.",
      severity: "error",
    });
  }

  if (
    input.statusTarget === "ready" &&
    ROUTES_REQUIRING_PRICING_PROVENANCE.includes(input.billingRoute) &&
    (input.pricingProvenanceJson == null ||
      (typeof input.pricingProvenanceJson === "object" &&
        Object.keys(input.pricingProvenanceJson as object).length === 0))
  ) {
    blockingIssues.push({
      code: "pricing_provenance_required",
      field: "pricingProvenanceJson",
      message:
        "Plan-managed and NDIA-managed items require pricing provenance before becoming ready.",
      severity: "error",
    });
  }

  if (input.billingRoute === "unresolved") {
    blockingIssues.push({
      code: "billing_route_unresolved",
      field: "billingRoute",
      message: "Billing route is unresolved and cannot proceed.",
      severity: "error",
    });
  }

  if (
    isNdisRoute(input.billingRoute) &&
    input.ndisPaymentRoute == null &&
    input.statusTarget === "ready"
  ) {
    warnings.push({
      code: "ndis_payment_route_missing",
      field: "ndisPaymentRoute",
      message: "NDIS payment route is not set on this billable item.",
      severity: "warning",
    });
  }

  return {
    valid: blockingIssues.length === 0,
    blockingIssues,
    warnings,
  };
}

export function isNdisBillingRoute(route: NdisBillingRoute): boolean {
  return isNdisRoute(route);
}

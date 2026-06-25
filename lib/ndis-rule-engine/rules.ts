import type { NdisRuleDefinition } from "@/lib/ndis-rule-engine/types";

export const defaultNdisRules: NdisRuleDefinition[] = [
  {
    id: "consent_sensitive_access_needs",
    message: "Sensitive access needs need your consent before they can be shared.",
    when: (ctx) =>
      !ctx.participantConsent?.shareSensitiveAccessNeeds &&
      Boolean(ctx.serviceRequest.isPersonalCare),
    outcome: "reviewRequired",
    flag: {
      code: "consent_required",
      message: "Confirm what access information may be shared.",
      severity: "warning",
    },
  },
  {
    id: "ndis_line_item_review",
    message: "This service may need an NDIS line item review.",
    when: (ctx) => ctx.serviceRequest.fundingCategory === "unknown",
    outcome: "reviewRequired",
    flag: {
      code: "line_item_review",
      message: "A support coordinator or plan manager should confirm the line item.",
      severity: "info",
    },
  },
  {
    id: "unverified_ndis_registration",
    message: "Provider NDIS registration could not be verified.",
    when: (ctx) =>
      Boolean(ctx.providerVerification?.claimsNdisRegistration) &&
      !ctx.providerVerification?.verifiedNdisRegistration,
    outcome: "reviewRequired",
    flag: {
      code: "provider_unverified",
      message: "Check provider registration before proceeding.",
      severity: "warning",
    },
  },
  {
    id: "price_above_limit",
    message: "The quoted price is above the configured review limit.",
    when: (ctx) =>
      typeof ctx.priceLimitCents === "number" &&
      typeof ctx.serviceRequest.priceCents === "number" &&
      ctx.serviceRequest.priceCents > ctx.priceLimitCents,
    outcome: "blocked",
    flag: {
      code: "price_limit",
      message: "Pricing needs human review before booking.",
      severity: "error",
    },
  },
  {
    id: "wheelchair_vehicle_required",
    message: "This trip needs a wheelchair accessible vehicle.",
    when: (ctx) => Boolean(ctx.serviceRequest.requiresWheelchairVehicle),
    outcome: "reviewRequired",
    flag: {
      code: "wav_required",
      message: "Confirm vehicle accessibility features before dispatch.",
      severity: "warning",
    },
  },
  {
    id: "high_risk_personal_care",
    message: "Personal care involving a child needs human review.",
    when: (ctx) =>
      Boolean(ctx.serviceRequest.isPersonalCare && ctx.serviceRequest.involvesChild),
    outcome: "reviewRequired",
    flag: {
      code: "high_risk_care",
      message: "A MapAble reviewer will check this request.",
      severity: "warning",
    },
  },
];

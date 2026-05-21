import type { LineItemInput } from "@/lib/billing/calculations";

/** Care shift — 2 hours support work */
export const careShiftLineItems: LineItemInput[] = [
  {
    description: "Support coordination — 2 hours",
    quantity: 2,
    unitAmountCents: 6500,
    ndisLineItem: "07_001_0106_8_3",
    gstApplicable: false,
  },
];

/** Transport trip — single leg */
export const transportTripLineItems: LineItemInput[] = [
  {
    description: "Community transport — 45 km",
    quantity: 45,
    unitAmountCents: 120,
    ndisLineItem: "04_590_0125_6_1",
    gstApplicable: false,
  },
];

/** Combined care + transport */
export const combinedCareTransportLineItems: LineItemInput[] = [
  ...careShiftLineItems,
  ...transportTripLineItems,
];

/** Marketplace assistive technology (GST applicable) */
export const marketplaceAssistiveTechLineItems: LineItemInput[] = [
  {
    description: "Ergonomic keyboard — assistive technology",
    quantity: 1,
    unitAmountCents: 18900,
    gstApplicable: true,
  },
];

/** Provider Pro subscription placeholder (no line items — subscription via Stripe) */
export const providerProPlanCode = "provider_pro" as const;

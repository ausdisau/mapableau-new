import type {
  ShopOrderStatus,
  ShopProductCategory,
  ShopProductStatus,
} from "@prisma/client";

export type ShopProductSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ShopProductCategory;
  status: ShopProductStatus;
  unitAmountCents: number;
  currency: string;
  gstApplicable: boolean;
  stockQuantity: number | null;
  imageUrls: string[];
  accessibilityNotes: string | null;
  ndisRelevant: boolean;
};

export type ShopCartLine = {
  productId: string;
  slug: string;
  title: string;
  quantity: number;
  unitAmountCents: number;
  gstApplicable: boolean;
  ndisRelevant: boolean;
  lineSubtotalCents: number;
};

export type ShopCartTotals = {
  subtotalCents: number;
  gstCents: number;
  platformFeeCents: number;
  totalCents: number;
  currency: string;
};

export type ShopCartView = {
  lines: ShopCartLine[];
  totals: ShopCartTotals;
  itemCount: number;
};

export type ShopOrderSummary = {
  id: string;
  status: ShopOrderStatus;
  billingInvoiceId: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  shippingName: string | null;
  shippingEmail: string | null;
};

export const SHOPPING_CATEGORY_LABELS: Record<ShopProductCategory, string> = {
  assistive_technology: "Assistive technology",
  daily_living: "Daily living",
  mobility: "Mobility",
  communication: "Communication",
};

export const SHOPPING_SAFETY_DISCLAIMER =
  "MapAble Shopping does not guarantee NDIS funding approval. Invoices are evidence only — check your plan, plan manager or the NDIA before claiming.";

export const SHOPPING_NDIS_NOTE =
  "NDIS-relevant products may support your records, but payment does not automatically create or approve an NDIS claim.";

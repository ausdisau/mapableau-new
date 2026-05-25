import type { FoodOrderStatus, FoodTextureLevel } from "@prisma/client";

export const FOOD_TEXTURE_LABELS: Record<FoodTextureLevel, string> = {
  standard: "Standard texture",
  soft: "Soft",
  minced_moist: "Minced and moist",
  pureed: "Pureed",
  liquidised: "Liquidised",
};

export const FOOD_ORDER_STATUS_LABELS: Record<FoodOrderStatus, string> = {
  draft: "Draft",
  allergy_pending: "Confirm allergies",
  submitted: "Submitted",
  scheduled: "Delivery scheduled",
  in_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type MenuItemPublic = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string;
  textureLevel: FoodTextureLevel;
  textureLabel: string;
  allergenLabels: string[];
  ingredientCostCents: number;
  preparationCostCents: number;
};

export type FoodInvoiceSplitView = {
  ingredientCents: number;
  preparationCents: number;
  deliveryCents: number;
  totalCents: number;
  plainLanguageNote: string;
};

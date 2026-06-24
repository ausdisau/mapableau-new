import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";

export const DONATION_PRESET_AMOUNTS_AUD = [25, 50, 100] as const;

export const DONATION_PRODUCT_NAME = "Donation to Australian Disability Ltd (MapAble)";

export const donationConfig = {
  paypalUrl: MAPABLE_DONATION_URL,
  minAmountAud: 5,
  maxAmountAud: 10_000,
  currency: "aud" as const,
  successPath: "/donate?status=success",
  cancelPath: "/donate?status=cancelled",
};

import type { SafeAdContext } from "@/lib/ads/ad-slot-policy";

export type AdSlotStatus = "loading" | "empty" | "filled" | "blocked" | "error";

export type AdCreative = {
  id: string;
  title: string;
  description?: string;
  href: string;
  width: 160 | 300;
  height: 600;
};

export type AdSlotResponse = {
  slotId: string;
  status: AdSlotStatus;
  creative?: AdCreative;
};

export function resolveAdSlotContent(
  slotId: string,
  _context: SafeAdContext,
): AdSlotResponse {
  if (process.env.ADS_DISABLED === "true") {
    return { slotId, status: "blocked" };
  }

  const isDemo = slotId.includes("skyscraper");
  if (!isDemo) {
    return { slotId, status: "empty" };
  }

  return {
    slotId,
    status: "filled",
    creative: {
      id: `demo-${slotId}`,
      title: "Accessible transport options",
      description:
        "Explore wheelchair-accessible transport providers in your region. Sponsored listing.",
      href: "/provider-finder",
      width: slotId.includes("300") ? 300 : 160,
      height: 600,
    },
  };
}

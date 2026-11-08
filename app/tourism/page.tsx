import type { Metadata } from "next";

import { TourismDiscover } from "@/components/tourism/TourismExperience";

export const metadata: Metadata = {
  title: "MapAble Tourism | Discover Sydney",
  description:
    "Illustrative Sydney tourism prototype with sourced access notes. Local data only — not bookings or certified access.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TourismDiscover />;
}

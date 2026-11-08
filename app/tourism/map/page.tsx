import type { Metadata } from "next";

import { TourismMapPage } from "@/components/tourism/TourismExperience";

export const metadata: Metadata = {
  title: "Sydney map | MapAble Tourism",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TourismMapPage />;
}

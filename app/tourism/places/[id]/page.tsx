import type { Metadata } from "next";

import { TourismPlaceDetail } from "@/components/tourism/TourismExperience";

export const metadata: Metadata = {
  title: "Venue accessibility information | MapAble Tourism",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TourismPlaceDetail id={id} />;
}

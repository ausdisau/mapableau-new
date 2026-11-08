import type { Metadata } from "next";
import Link from "next/link";

import { TourismItinerary } from "@/components/tourism/TourismExperience";

export const metadata: Metadata = {
  title: "Your Sydney itinerary | MapAble Tourism",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "sydney-demo") {
    return (
      <div className="px-5 py-12 lg:px-8">
        <h1 className="text-3xl font-black">Trip not found</h1>
        <Link className="mt-4 inline-block underline" href="/tourism/plan">
          Create a trip
        </Link>
      </div>
    );
  }
  return <TourismItinerary />;
}

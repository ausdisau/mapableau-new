import type { Metadata } from "next";

import { PassengerPractice } from "@/components/transport/passenger/PassengerPractice";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata: Metadata = {
  title: "Passenger trips | MapAble Transport",
  description:
    "Practise planning accessible travel, reviewing a quote and choosing what to share with a driver.",
  alternates: canonicalAlternate("/transport/passenger"),
};

export default async function PassengerPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const { plan } = await searchParams;
  return <PassengerPractice fromAppointment={plan === "appointment"} />;
}

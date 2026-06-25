"use client";

import { useSearchParams } from "next/navigation";

import { NewTransportTripForm } from "@/components/transport/NewTransportTripForm";

export function NewTransportTripFormWithPlace() {
  const params = useSearchParams();
  const placeId = params.get("placeId") ?? undefined;
  return <NewTransportTripForm placeId={placeId} />;
}

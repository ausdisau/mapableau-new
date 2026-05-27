"use client";

import { useSearchParams } from "next/navigation";

import { ShiftCreatorClient } from "@/components/care/shift-creator/ShiftCreatorClient";

export function ShiftCreatorPageClient() {
  const searchParams = useSearchParams();
  const careBookingId = searchParams.get("careBookingId")?.trim() || undefined;
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  return (
    <ShiftCreatorClient careBookingId={careBookingId} initialQuery={initialQuery} />
  );
}

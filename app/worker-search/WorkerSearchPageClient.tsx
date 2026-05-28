"use client";

import { useSearchParams } from "next/navigation";

import { WorkerSearchClient } from "@/components/worker-search/WorkerSearchClient";
import type { WorkerSearchFilters } from "@/lib/search/worker-search-types";

export function WorkerSearchPageClient() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId")?.trim() || undefined;
  const initialQuery = searchParams.get("q")?.trim() ?? "";
  const initialFilters: WorkerSearchFilters = {};

  const serviceType = searchParams.get("serviceType");
  const language = searchParams.get("language");
  const serviceRegion = searchParams.get("serviceRegion");
  if (serviceType) initialFilters.serviceType = serviceType;
  if (language) initialFilters.language = language;
  if (serviceRegion) initialFilters.serviceRegion = serviceRegion;
  if (searchParams.get("wheelchairAccessible") === "true") {
    initialFilters.wheelchairAccessible = true;
  }

  return (
    <WorkerSearchClient
      participantId={participantId}
      initialQuery={initialQuery}
      initialFilters={initialFilters}
    />
  );
}

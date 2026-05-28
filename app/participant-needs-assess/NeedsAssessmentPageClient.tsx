"use client";

import { useSearchParams } from "next/navigation";

import { NeedsAssessmentClient } from "@/components/participant-needs/NeedsAssessmentClient";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

export function NeedsAssessmentPageClient() {
  const searchParams = useSearchParams();
  const participantId =
    searchParams.get("participantId")?.trim() || MOCK_PARTICIPANT_ID;
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  return (
    <NeedsAssessmentClient
      participantId={participantId}
      initialQuery={initialQuery}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InterviewJourneyClient } from "@/components/pilot/starting-work/InterviewJourneyClient";
import { isInterviewJourneyPreviewAvailable } from "@/lib/config/starting-work-pilot";
import { interviewJourneyFixture } from "@/lib/pilot/starting-work/interview-journey-fixture";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Plan my interview journey | MapAble pilot",
  robots: { index: false, follow: false },
};

/**
 * MapAble One interview journey example.
 * Gated by Starting Work pilot + synthetic-only; 404 outside local/CI/preview.
 * No booking, payment, dispatch, model calls, or persistence of free text.
 */
export default function InterviewJourneyPage() {
  if (!isInterviewJourneyPreviewAvailable()) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-8">
      <p className="text-sm text-slate-600">
        Synthetic pilot example · {interviewJourneyFixture.productionClaim} production claim ·
        booking/payment/dispatch disabled
      </p>
      <InterviewJourneyClient />
    </main>
  );
}

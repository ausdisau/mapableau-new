import { Suspense } from "react";

import { NeedsAssessmentPageClient } from "./NeedsAssessmentPageClient";

export default function ParticipantNeedsAssessPage() {
  return (
    <Suspense
      fallback={
        <p className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading needs assessment…
        </p>
      }
    >
      <NeedsAssessmentPageClient />
    </Suspense>
  );
}

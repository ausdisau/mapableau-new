import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { AuthorStudio } from "@/components/access-intelligence/learning/author-studio";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";

export const metadata: Metadata = {
  title: "Scenario authoring | Access Intelligence",
  description:
    "Author Learning Lab scenarios with review gates before publish.",
};

export default function LearningAuthorPage() {
  const repo = getLearningRepository();
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Author studio"
        description="Define objectives, audiences, evidence, branches, dynamic events, and rubric rules. Publish only after required reviews."
      >
        <AuthorStudio
          initialScenarios={repo.listScenarios()}
          initialReviews={repo.listContentReviews()}
        />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}

import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { RegressionLabClient } from "@/components/access-intelligence/regression-lab-client";

export const metadata: Metadata = {
  title: "Regression lab | Access Intelligence",
  description:
    "Synthetic fixtures, red-team corpus, and release evidence packs.",
};

export default function RegressionLabPage() {
  return (
    <AccessIntelligenceShell
      title="Accessibility regression lab"
      description="Run synthetic passport fixtures, corridor regressions, red-team cases, and adapter contract simulations before release."
    >
      <RegressionLabClient />
    </AccessIntelligenceShell>
  );
}

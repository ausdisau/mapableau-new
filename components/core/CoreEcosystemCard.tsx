import type { CoreEcosystemApp } from "@/lib/core-ui/ecosystem";

import { CoreHubCard } from "./CoreHubCard";

export function CoreEcosystemCard({ app }: { app: CoreEcosystemApp }) {
  return (
    <CoreHubCard
      title={app.name}
      description={app.description}
      status="roadmap"
    />
  );
}

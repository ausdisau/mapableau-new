"use client";

import { AccessConditionsSection } from "@/components/gais/AccessConditionsSection";
import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";

const SANDBOX_GRAPH_ID = "sandbox-sydney-cbd-pilot";

export function GoAccessConditions({ compact = true }: { compact?: boolean }) {
  const enabled = isClientGaisLayerEnabled();

  return (
    <AccessConditionsSection
      enabled={enabled}
      graphId={SANDBOX_GRAPH_ID}
      compact={compact}
    />
  );
}

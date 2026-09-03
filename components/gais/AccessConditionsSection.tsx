"use client";

import { AccessConditionsPanel } from "@/components/gais/AccessConditionsPanel";
import { useAccessConditions } from "@/hooks/useAccessConditions";
import type { GaisBoundsInput } from "@/lib/gais/client/fetch-events";

export function AccessConditionsSection({
  enabled,
  bounds,
  placeId,
  graphId,
  compact = false,
}: {
  enabled: boolean;
  bounds?: GaisBoundsInput | null;
  placeId?: string;
  graphId?: string;
  compact?: boolean;
}) {
  const { events, loading, error } = useAccessConditions(
    { bounds, placeId, graphId },
    enabled,
  );

  if (!enabled) return null;

  return (
    <AccessConditionsPanel
      events={events}
      loading={loading}
      error={error}
      compact={compact}
    />
  );
}

"use client";

import { AccessConditionsSection } from "@/components/gais/AccessConditionsSection";
import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";

export function AccessPlaceConditions({ placeId }: { placeId: string }) {
  const enabled = isClientGaisLayerEnabled();

  return (
    <AccessConditionsSection enabled={enabled} placeId={placeId} />
  );
}

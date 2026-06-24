import React from "react";

import { SponsoredLabel } from "@/components/ads/SponsoredLabel";

type AdPlaceholderProps = {
  width: 160 | 300;
  height?: number;
  message?: string;
};

export function AdPlaceholder({
  width,
  height = 600,
  message = "Ad space available",
}: AdPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-2 py-4 text-center"
      style={{ width, minHeight: Math.min(height, 400) }}
      aria-hidden="true"
    >
      <SponsoredLabel />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

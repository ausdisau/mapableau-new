"use client";

import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function GaisLayerToggle({
  enabled,
  onChange,
  layerEnabled = isClientGaisLayerEnabled(),
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
  layerEnabled?: boolean;
}) {
  if (!layerEnabled) return null;

  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold ${mapableInteractiveFocusRing}`}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className={mapableInteractiveFocusRing}
      />
      <span>Accessibility information layer</span>
      <span className="text-xs font-normal text-slate-500">(GAIS — in development)</span>
    </label>
  );
}

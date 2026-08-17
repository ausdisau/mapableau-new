import React from "react";

import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";

/**
 * Shown when Wave 1 synthetic demo flags are off.
 * No camera controls are offered in either state.
 */
export function AccessLensDemoUnavailable() {
  return (
    <div
      className={`${mapablePublicMutedCardClass} space-y-3`}
      role="status"
      aria-live="polite"
    >
      <h2 className="text-lg font-black text-mapable-navy">
        Synthetic demo is not enabled
      </h2>
      <p className="text-sm leading-6 text-slate-700">
        Access Lens Wave 1 is contracts and fixtures only. Enable{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          MAPABLE_VISION_SYNTHETIC_DEMO_ENABLED=true
        </code>{" "}
        or{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          MAPABLE_VISION_ACCESS_ENABLED=true
        </code>{" "}
        (or local{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          MAPABLE_VISION_DEMO=true
        </code>
        ) to load the Harbour Civic fixture. Camera, upload, and live capture
        remain disabled.
      </p>
    </div>
  );
}

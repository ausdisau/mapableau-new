import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function FictionalBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${mapableCareFocusRing}`}
    >
      <p className="font-black">Fictional demonstration data</p>
      <p className="mt-1">
        {children ??
          "Harbour Civic Centre devices, Scout fixtures, and Physical Environment Simulator events are labelled mocks. No live lift, door, BMS, or robot hardware is connected."}
      </p>
    </div>
  );
}

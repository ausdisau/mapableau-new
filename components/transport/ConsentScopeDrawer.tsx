"use client";

import {
  ConsentScopeCheckbox,
  type ConsentScopeOption,
} from "@/components/consent/ConsentScopeCheckbox";
import { bookingScope } from "@/lib/transport/booking-consent";

export const TRANSPORT_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: bookingScope.kerbsideNote,
    label: "Share kerbside access note with the assigned driver",
    description: "Buzzer, ramp side, meeting point — revocable before dispatch.",
  },
  {
    id: bookingScope.mobilitySummary,
    label: "Share functional mobility summary with the provider",
    description: "Wheelchair / hoist / assistance flags only — not diagnoses.",
  },
  {
    id: bookingScope.ndisLineItemTag,
    label: "Share NDIS line-item tag with the provider (optional)",
    description: "A funding tag is not an approval. Unticked by default.",
  },
];

type Props = {
  checkedIds: string[];
  onChange: (nextIds: string[]) => void;
  error?: string;
};

/**
 * Step 03 — granular, revocable driver-sharing consents with clinical-data warning.
 */
export function ConsentScopeDrawer({ checkedIds, onChange, error }: Props) {
  return (
    <div className="space-y-3">
      <div className="tb-warning" role="note">
        Do not paste clinical diagnoses or unencrypted NDIS plan documents into
        driver pickup notes. Only share what you explicitly tick below. Unticked
        scopes are never auto-shared.
      </div>
      <ConsentScopeCheckbox
        scopes={TRANSPORT_CONSENT_SCOPES}
        checkedIds={checkedIds}
        onChange={onChange}
        legend="Consent & driver notes scope"
        error={error}
      />
      <p className="tb-ink-secondary text-xs">
        Controlled Pilot Request — a human dispatcher reviews fit. This is not an
        automated marketplace checkout.
      </p>
    </div>
  );
}

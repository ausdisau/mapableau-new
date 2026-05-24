"use client";

import type { AccessibilityFormState } from "@/components/bookings/AccessibilityRequirementsStep";

export function BookingReviewStep({
  bookingType,
  providerName,
  requestedStart,
  requestedEnd,
  accessibility,
  estimatedTotalCents,
  ndisSupportCategory,
  ndisLineItem,
  consent,
  onConsentChange,
}: {
  bookingType: string;
  providerName?: string;
  requestedStart: string;
  requestedEnd: string;
  accessibility: AccessibilityFormState;
  estimatedTotalCents?: number;
  ndisSupportCategory?: string;
  ndisLineItem?: string;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
}) {
  const reqs = [
    accessibility.wheelchairAccess && "Wheelchair access",
    accessibility.hoistOrTransfer && "Hoist / transfer",
    accessibility.communicationSupport && "Communication support",
    accessibility.assistanceAnimal && "Assistance animal",
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review your request</h2>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Type</dt>
          <dd>{bookingType.replace("_", " + ")}</dd>
        </div>
        {providerName && (
          <div>
            <dt className="font-medium">Provider</dt>
            <dd>{providerName}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium">Start</dt>
          <dd>{requestedStart || "—"}</dd>
        </div>
        {requestedEnd && (
          <div>
            <dt className="font-medium">End</dt>
            <dd>{requestedEnd}</dd>
          </div>
        )}
        {reqs.length > 0 && (
          <div>
            <dt className="font-medium">Accessibility</dt>
            <dd>{reqs.join(", ")}</dd>
          </div>
        )}
        {estimatedTotalCents != null && estimatedTotalCents > 0 && (
          <div>
            <dt className="font-medium">Estimated cost</dt>
            <dd>${(estimatedTotalCents / 100).toFixed(2)} AUD</dd>
          </div>
        )}
        {(ndisSupportCategory || ndisLineItem) && (
          <div>
            <dt className="font-medium">NDIS</dt>
            <dd>
              {[ndisSupportCategory, ndisLineItem].filter(Boolean).join(" — ")}
            </dd>
          </div>
        )}
      </dl>
      <label className="flex items-start gap-3 rounded-lg border p-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={consent}
          onChange={(e) => onConsentChange(e.target.checked)}
          required
        />
        <span>
          I confirm these details are correct and I agree to MapAble contacting
          the provider about this request.
        </span>
      </label>
    </div>
  );
}

"use client";

import { AccessibleFormField, formInputClass } from "@/components/forms/AccessibleFormField";

export type AccessibilityFormState = {
  wheelchairAccess: boolean;
  hoistOrTransfer: boolean;
  communicationSupport: boolean;
  sensoryPreferences: string;
  assistanceAnimal: boolean;
  otherNotes: string;
};

export function AccessibilityRequirementsStep({
  value,
  onChange,
  shareAccessibility,
  onShareChange,
}: {
  value: AccessibilityFormState;
  onChange: (next: AccessibilityFormState) => void;
  shareAccessibility: boolean;
  onShareChange: (v: boolean) => void;
}) {
  function toggle(key: keyof AccessibilityFormState, checked: boolean) {
    onChange({ ...value, [key]: checked });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Accessibility requirements</h2>
      <p className="text-sm text-muted-foreground">
        Tell us what you need so providers can prepare safe, dignified support.
      </p>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={value.wheelchairAccess}
          onChange={(e) => toggle("wheelchairAccess", e.target.checked)}
        />
        <span>Wheelchair access required</span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={value.hoistOrTransfer}
          onChange={(e) => toggle("hoistOrTransfer", e.target.checked)}
        />
        <span>Hoist or transfer assistance</span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={value.communicationSupport}
          onChange={(e) => toggle("communicationSupport", e.target.checked)}
        />
        <span>Communication support (e.g. AAC, plain language)</span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={value.assistanceAnimal}
          onChange={(e) => toggle("assistanceAnimal", e.target.checked)}
        />
        <span>Assistance animal will attend</span>
      </label>
      <AccessibleFormField label="Sensory preferences" id="sensoryPreferences">
        <input
          id="sensoryPreferences"
          className={formInputClass}
          value={value.sensoryPreferences}
          onChange={(e) =>
            onChange({ ...value, sensoryPreferences: e.target.value })
          }
        />
      </AccessibleFormField>
      <AccessibleFormField label="Other requirements" id="otherNotes">
        <textarea
          id="otherNotes"
          className={formInputClass}
          rows={3}
          value={value.otherNotes}
          onChange={(e) => onChange({ ...value, otherNotes: e.target.value })}
        />
      </AccessibleFormField>
      <label className="flex items-start gap-3 rounded-lg border p-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={shareAccessibility}
          onChange={(e) => onShareChange(e.target.checked)}
        />
        <span>
          I consent to share my accessibility profile with the selected
          provider for this booking.
        </span>
      </label>
    </div>
  );
}

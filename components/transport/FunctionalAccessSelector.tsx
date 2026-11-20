"use client";

import { MobilityRequirementsForm } from "@/components/transport/MobilityRequirementsForm";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

type Props = {
  values: MobilityRequirements;
  onChange: (next: MobilityRequirements) => void;
  idPrefix?: string;
};

/**
 * Step 02 — functional access needs only (no medical diagnoses).
 * Wraps the shared MobilityRequirementsForm.
 */
export function FunctionalAccessSelector({
  values,
  onChange,
  idPrefix = "access",
}: Props) {
  return (
    <div className="space-y-3">
      <p className="tb-ink-secondary text-sm">
        Describe the vehicle and boarding support you need. Do not include
        clinical diagnoses — functional fit is enough for matching.
      </p>
      <MobilityRequirementsForm
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
      />
    </div>
  );
}

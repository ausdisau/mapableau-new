"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function DeliveryHandoverInstructions() {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Delivery handover instructions</legend>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell your driver how to hand over your order (e.g. knock twice, leave at door).
      </p>
      <label htmlFor="handover-notes" className="sr-only">
        Handover notes
      </label>
      <textarea
        id="handover-notes"
        name="handoverNotes"
        rows={4}
        className={`${formInputClass} mt-2`}
        placeholder="Plain-language instructions for the driver"
      />
    </fieldset>
  );
}

"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function DeliveryWindowSelector({
  startName = "deliveryWindowStart",
  endName = "deliveryWindowEnd",
}: {
  startName?: string;
  endName?: string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Delivery window</legend>
      <div>
        <label htmlFor={startName} className="text-sm">
          From
        </label>
        <input
          id={startName}
          name={startName}
          type="datetime-local"
          required
          className={formInputClass}
        />
      </div>
      <div>
        <label htmlFor={endName} className="text-sm">
          To
        </label>
        <input
          id={endName}
          name={endName}
          type="datetime-local"
          required
          className={formInputClass}
        />
      </div>
    </fieldset>
  );
}

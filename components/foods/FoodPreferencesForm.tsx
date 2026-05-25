"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function FoodPreferencesForm({
  initialDietary = "",
  initialDeliveryNotes = "",
}: {
  initialDietary?: string;
  initialDeliveryNotes?: string;
}) {
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dietary = String(fd.get("dietary") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await fetch("/api/foods/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dietaryPreferences: dietary,
        deliveryNotes: fd.get("deliveryNotes"),
      }),
    });
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <h2 className="text-lg font-semibold">Dietary & delivery preferences</h2>
      <div>
        <label htmlFor="dietary" className="text-sm font-medium">
          Dietary preferences (comma-separated)
        </label>
        <input
          id="dietary"
          name="dietary"
          defaultValue={initialDietary}
          className={formInputClass}
        />
      </div>
      <div>
        <label htmlFor="deliveryNotes" className="text-sm font-medium">
          Default delivery notes
        </label>
        <textarea
          id="deliveryNotes"
          name="deliveryNotes"
          defaultValue={initialDeliveryNotes}
          className={formInputClass}
          rows={3}
        />
      </div>
      <Button type="submit" variant="default" size="default">
        Save preferences
      </Button>
      {saved ? <p role="status">Saved.</p> : null}
    </form>
  );
}

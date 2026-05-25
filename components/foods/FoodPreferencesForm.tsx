"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function FoodSubstitutionPreferences() {
  return (
    <label className="block text-sm font-medium">
      Default substitution policy
      <select name="substitutionPolicy" className={formInputClass} defaultValue="contact_me">
        <option value="no_substitutions">No substitutions</option>
        <option value="contact_me">Contact me first</option>
        <option value="closest_match">Closest safe match</option>
        <option value="provider_choice">Provider choice</option>
      </select>
    </label>
  );
}

export function FoodPreferencesForm() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    await fetch("/api/foods/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dietaryPreferences: String(fd.get("dietaryPreferences") ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        texturePreferences: String(fd.get("texturePreferences") ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        allergens: String(fd.get("allergens") ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        accessibilityNotes: fd.get("accessibilityNotes") || undefined,
        severityNotes: fd.get("severityNotes") || undefined,
        emergencyPlan: fd.get("emergencyPlan") || undefined,
        shareWithVendors: fd.get("shareWithVendors") === "on",
        shareWithDrivers: fd.get("shareWithDrivers") === "on",
        notificationOptInAmounts: fd.get("notificationOptInAmounts") === "on",
        substitutionPolicy: fd.get("substitutionPolicy") || undefined,
      }),
    });
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      {saved ? <p role="status">Preferences saved.</p> : null}
      <input name="dietaryPreferences" placeholder="Dietary tags, comma separated" className={formInputClass} />
      <input name="texturePreferences" placeholder="Texture preferences" className={formInputClass} />
      <input name="allergens" placeholder="Allergens, comma separated" className={formInputClass} />
      <textarea name="accessibilityNotes" placeholder="Accessibility notes" className={`${formInputClass} min-h-20`} />
      <textarea name="severityNotes" placeholder="Allergy severity notes" className={`${formInputClass} min-h-20`} />
      <textarea name="emergencyPlan" placeholder="Emergency plan" className={`${formInputClass} min-h-20`} />
      <FoodSubstitutionPreferences />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="shareWithVendors" className="h-5 w-5" />
        Share allergy profile with vendors when I consent
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="shareWithDrivers" className="h-5 w-5" />
        Share minimal allergen flags with assigned drivers when I consent
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="notificationOptInAmounts" className="h-5 w-5" />
        Include amounts in notifications
      </label>
      <button className="min-h-11 rounded-lg bg-orange-600 px-6 font-semibold text-white">
        Save preferences
      </button>
    </form>
  );
}

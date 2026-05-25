"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function FoodSubstitutionPreferences({
  defaultPolicy = "contact_first",
}: {
  defaultPolicy?: string;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/foods/substitutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy: fd.get("policy"),
            notes: fd.get("notes"),
          }),
        });
      }}
    >
      <h2 className="text-lg font-semibold">Substitution preferences</h2>
      <p className="text-sm text-muted-foreground">
        If an item is unavailable, we will follow this policy. We will contact you before
        substituting when required.
      </p>
      <label htmlFor="policy" className="text-sm font-medium">
        Policy
      </label>
      <select id="policy" name="policy" defaultValue={defaultPolicy} className={formInputClass}>
        <option value="contact_first">Contact me first</option>
        <option value="allow_similar">Allow similar substitute</option>
        <option value="no_substitutions">No substitutions</option>
        <option value="vendor_choice">Vendor may choose equivalent</option>
      </select>
      <label htmlFor="notes" className="text-sm font-medium">
        Notes
      </label>
      <textarea id="notes" name="notes" rows={3} className={formInputClass} />
      <Button type="submit" variant="default" size="default">
        Save
      </Button>
    </form>
  );
}

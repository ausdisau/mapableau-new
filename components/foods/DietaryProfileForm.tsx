"use client";

import { useState } from "react";

type DietaryProfileFormProps = {
  initial?: {
    allergies?: string[];
    intolerances?: string[];
    culturalPreferences?: string[];
    textureRequirement?: string;
    swallowingRiskFlag?: boolean;
    notes?: string;
  };
};

export function DietaryProfileForm({ initial }: DietaryProfileFormProps) {
  const [allergies, setAllergies] = useState(
    (initial?.allergies ?? []).join(", "),
  );
  const [intolerances, setIntolerances] = useState(
    (initial?.intolerances ?? []).join(", "),
  );
  const [cultural, setCultural] = useState(
    (initial?.culturalPreferences ?? []).join(", "),
  );
  const [texture, setTexture] = useState(
    initial?.textureRequirement ?? "standard",
  );
  const [swallowingRisk, setSwallowingRisk] = useState(
    initial?.swallowingRiskFlag ?? false,
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/foods/dietary-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allergies: allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        intolerances: intolerances
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        culturalPreferences: cultural
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        textureRequirement: texture,
        swallowingRiskFlag: swallowingRisk,
        notes: notes || undefined,
      }),
    });
    setSaving(false);
    setStatus(res.ok ? "Saved dietary profile." : "Save failed.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="allergies" className="block text-sm font-medium">
          Allergies (comma-separated)
        </label>
        <input
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
        />
      </div>
      <div>
        <label htmlFor="intolerances" className="block text-sm font-medium">
          Intolerances
        </label>
        <input
          id="intolerances"
          value={intolerances}
          onChange={(e) => setIntolerances(e.target.value)}
          className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
        />
      </div>
      <div>
        <label htmlFor="cultural" className="block text-sm font-medium">
          Cultural or religious preferences
        </label>
        <input
          id="cultural"
          value={cultural}
          onChange={(e) => setCultural(e.target.value)}
          className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
        />
      </div>
      <div>
        <label htmlFor="texture" className="block text-sm font-medium">
          Texture requirement
        </label>
        <select
          id="texture"
          value={texture}
          onChange={(e) => setTexture(e.target.value)}
          className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
        >
          <option value="standard">Standard</option>
          <option value="soft">Soft</option>
          <option value="minced_moist">Minced & moist</option>
          <option value="pureed">Pureed</option>
          <option value="liquidised">Liquidised</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={swallowingRisk}
          onChange={(e) => setSwallowingRisk(e.target.checked)}
        />
        Swallowing risk flagged for clinical review
      </label>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
      {status ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";

import {
  PROVIDER_SEARCH_CONSENT_VERSION,
  PROVIDER_FUNCTIONAL_REQUIREMENTS,
  type ProviderSearchPreferences,
  type SavedProviderSearchProfile,
} from "@/lib/provider/finder/search-profile-contract";
import {
  PROVIDER_SERVICE_CATALOG,
  PROVIDER_SERVICE_IDS,
} from "@/lib/provider/finder/search-service-catalog";

const emptyPreferences: ProviderSearchPreferences = {
  serviceTypes: [],
  functionalRequirements: [],
  communicationModes: [],
  delivery: "any",
  fundingManagement: "unspecified",
};

type Props = { onSavedAvailabilityChange: (available: boolean) => void };

export default function ProviderSearchProfileForm({ onSavedAvailabilityChange }: Props) {
  const [available, setAvailable] = useState(false);
  const [saved, setSaved] = useState<SavedProviderSearchProfile | null>(null);
  const [draft, setDraft] = useState<ProviderSearchPreferences>(emptyPreferences);
  const [consentChecked, setConsentChecked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Loading saved matching preferences…");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/providers/search-profile", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          setNotice("Sign in to save and control your preferences.");
          return;
        }
        if (response.status === 503) {
          setNotice("Saved preferences are not enabled yet. You can still use search-only filters.");
          return;
        }
        if (!response.ok) throw new Error("Could not retrieve your saved preferences");
        const data = (await response.json()) as { profile: SavedProviderSearchProfile | null };
        if (cancelled) return;
        setAvailable(true);
        setSaved(data.profile);
        onSavedAvailabilityChange(Boolean(data.profile));
        if (data.profile) setDraft(data.profile.preferences);
        setNotice(data.profile
          ? "Your private profile is saved. It will only be used when you choose it for a search."
          : "No profile saved. Search works without one.");
      })
      .catch(() => { if (!cancelled) setNotice("Saved preferences could not be loaded."); });
    return () => { cancelled = true; };
  }, [onSavedAvailabilityChange]);

  function toggleService(id: (typeof PROVIDER_SERVICE_IDS)[number], selected: boolean) {
    setDraft((previous) => ({
      ...previous,
      serviceTypes: selected
        ? [...previous.serviceTypes, id].slice(0, 5)
        : previous.serviceTypes.filter((value) => value !== id),
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentChecked) {
      setNotice("Please actively confirm consent before saving.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/providers/search-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION,
          preferences: draft,
        }),
      });
      if (!response.ok) throw new Error("Could not save preferences (" + response.status + ")");
      const data = (await response.json()) as { profile: SavedProviderSearchProfile };
      setSaved(data.profile);
      onSavedAvailabilityChange(true);
      setConsentChecked(false);
      setNotice("Preferences saved privately. Personalisation is still off until you select it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const response = await fetch("/api/providers/search-profile", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete preferences");
      setSaved(null);
      setDraft(emptyPreferences);
      setConfirmDelete(false);
      setConsentChecked(false);
      onSavedAvailabilityChange(false);
      setNotice("Saved profile deleted and matching consent withdrawn.");
    } catch {
      setNotice("Could not delete saved preferences. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportMyProfile() {
    if (!saved) return;
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mapable-my-provider-search-preferences.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="space-y-3 rounded-lg border p-3">
      <summary className="cursor-pointer font-semibold">My private matching preferences</summary>
      <p className="mt-2 text-sm">
        Optional. MapAble stores only broad matching criteria, not diagnoses, medical records, NDIS numbers,
        home addresses or chat history. Your preferences stay private and are not disclosed to providers.
        You must separately select personalisation for each search.
      </p>
      <p role="status" aria-live="polite" className="text-sm">{notice}</p>
      {available && <form onSubmit={handleSave} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">Preferred state
            <select className="rounded-md border bg-background p-2" value={draft.state ?? ""}
              onChange={(event) => setDraft((p) => ({
                ...p, state: (event.target.value || undefined) as ProviderSearchPreferences["state"],
              }))}>
              <option value="">No preference</option>
              {["NSW","VIC","QLD","SA","WA","TAS","ACT","NT"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">Postcode (optional)
            <input className="rounded-md border bg-background p-2" inputMode="numeric"
              pattern="[0-9]{4}" maxLength={4} value={draft.postcode ?? ""}
              onChange={(event) => setDraft((p) => ({ ...p, postcode: event.target.value || undefined }))} />
          </label>
          <label className="flex flex-col gap-1 text-sm">Suburb (optional, no street address)
            <input className="rounded-md border bg-background p-2" maxLength={50}
              value={draft.suburb ?? ""}
              onChange={(event) => setDraft((p) => ({ ...p, suburb: event.target.value || undefined }))} />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="font-medium">Support categories (up to five)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROVIDER_SERVICE_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.serviceTypes.includes(id)}
                  disabled={!draft.serviceTypes.includes(id) && draft.serviceTypes.length >= 5}
                  onChange={(event) => toggleService(id, event.target.checked)} />
                {PROVIDER_SERVICE_CATALOG[id].label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium">Functional access requirements (not verified by directory listings)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROVIDER_FUNCTIONAL_REQUIREMENTS.map(({ id, label }) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.functionalRequirements.includes(id)}
                  onChange={(event) => setDraft((p) => ({
                    ...p, functionalRequirements: event.target.checked
                      ? [...p.functionalRequirements, id]
                      : p.functionalRequirements.filter((entry) => entry !== id),
                  }))} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium">Preferred communication (requires provider confirmation)</legend>
          <div className="flex flex-wrap gap-3">
            {(["AAC", "Text", "Auslan"] as const).map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.communicationModes.includes(mode)}
                  onChange={(event) => setDraft((p) => ({
                    ...p,
                    communicationModes: event.target.checked
                      ? [...p.communicationModes, mode]
                      : p.communicationModes.filter((entry) => entry !== mode),
                  }))} />
                {mode}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">Delivery preference
            <select className="rounded-md border bg-background p-2" value={draft.delivery}
              onChange={(event) => setDraft((p) => ({
                ...p, delivery: event.target.value as ProviderSearchPreferences["delivery"],
              }))}>
              <option value="any">Any / not specified</option>
              <option value="home_visit">Home visit</option>
              <option value="in_person">In person</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">Funding management
            <select className="rounded-md border bg-background p-2" value={draft.fundingManagement}
              onChange={(event) => setDraft((p) => ({
                ...p, fundingManagement: event.target.value as ProviderSearchPreferences["fundingManagement"],
              }))}>
              <option value="unspecified">Prefer not to specify</option>
              <option value="ndia">NDIA-managed</option>
              <option value="plan">Plan-managed</option>
              <option value="self">Self-managed</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Delivery, communication and funding preferences are advisory only where the directory lacks evidence.
          They are not automatically shared or treated as confirmed provider capabilities.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required checked={consentChecked}
            onChange={(event) => setConsentChecked(event.target.checked)} />
          I consent to MapAble storing these encrypted preferences solely for personalised provider discovery.
          I can export, change or delete them. I understand no search uses them automatically.
        </label>
        <button type="submit" disabled={busy || !consentChecked}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
          {saved ? "Update private preferences" : "Save private preferences"}
        </button>
      </form>}
      {available && saved && <div className="space-y-2 border-t pt-3">
        <p className="text-sm">Last saved: {new Date(saved.updatedAt).toLocaleDateString("en-AU")}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-md border px-3 py-2" onClick={exportMyProfile}>
            Export my preferences
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)} />
            Confirm deletion
          </label>
          <button type="button" disabled={busy || !confirmDelete} onClick={handleDelete}
            className="rounded-md border px-3 py-2 disabled:opacity-50">
            Delete my saved profile
          </button>
        </div>
      </div>}
    </details>
  );
}

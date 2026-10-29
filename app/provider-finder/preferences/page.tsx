"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FormEvent } from "react";

type Preferences = {
  enabled: boolean;
  location: string;
  supportType: string;
  language: string;
};

const empty: Preferences = { enabled: false, location: "", supportType: "", language: "" };

export default function ProviderFinderPreferencesPage() {
  const { status } = useSession();
  const [prefs, setPrefs] = useState<Preferences>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/provider-finder/preferences", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Preferences are not yet available");
        return response.json();
      })
      .then((result: { preferences: {
        enabled: boolean; location: string | null;
        supportType: string | null; language: string | null;
      } }) => {
        if (cancelled) return;
        setPrefs({
          enabled: result.preferences.enabled,
          location: result.preferences.location ?? "",
          supportType: result.preferences.supportType ?? "",
          language: result.preferences.language ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load saved preferences. The database migration may not have run.");
      });
    return () => { cancelled = true; };
  }, [status]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/provider-finder/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!response.ok) throw new Error("Could not save preferences");
      if (!prefs.enabled) setPrefs(empty);
      setMessage(prefs.enabled ? "Preferences saved. You can switch them off at any time." : "Personalisation switched off and saved preferences erased.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally { setBusy(false); }
  }

  async function erase() {
    setBusy(true);
    try {
      const response = await fetch("/api/provider-finder/preferences", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not erase preferences");
      setPrefs(empty);
      setMessage("Your saved provider-search preferences have been erased.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Deletion failed");
    } finally { setBusy(false); }
  }

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Link href="/provider-finder" className="underline">Back to provider finder</Link>
      <h1 className="text-3xl font-bold">My search preferences</h1>
      <p>Personalisation is optional. Only the broad search preferences below are saved in your MapAble account.
        We do not silently import your health, accessibility or NDIS plan records.</p>
      {status === "loading" && <p role="status">Checking your sign-in…</p>}
      {status === "unauthenticated" && (
        <p><Link href="/login" className="underline">Sign in</Link> to manage your saved preferences.</p>
      )}
      {status === "authenticated" && (
        <form onSubmit={(event) => { void save(event); }} className="space-y-5 rounded-xl border p-5">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={prefs.enabled}
              onChange={(event) => setPrefs((old) => ({ ...old, enabled: event.target.checked }))}
              className="mt-1 h-5 w-5" />
            <span>Allow MapAble Finder to use these preferences when I choose personalised results.
              Turning this off and saving erases the stored fields.</span>
          </label>
          <div className="space-y-2">
            <label htmlFor="finder-pref-location" className="block font-medium">Broad suburb, postcode or state</label>
            <input id="finder-pref-location" value={prefs.location} maxLength={80}
              onChange={(event) => setPrefs((old) => ({ ...old, location: event.target.value }))}
              className="w-full rounded-md border bg-background p-3" placeholder="e.g. Sydney NSW" />
            <p className="text-xs text-muted-foreground">Do not enter your full home address or exact GPS location.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="finder-pref-support" className="block font-medium">Preferred support type</label>
            <input id="finder-pref-support" value={prefs.supportType} maxLength={80}
              onChange={(event) => setPrefs((old) => ({ ...old, supportType: event.target.value }))}
              className="w-full rounded-md border bg-background p-3" placeholder="e.g. Support coordination" />
          </div>
          <div className="space-y-2">
            <label htmlFor="finder-pref-language" className="block font-medium">Preferred spoken or signed language (optional)</label>
            <input id="finder-pref-language" value={prefs.language} maxLength={60}
              onChange={(event) => setPrefs((old) => ({ ...old, language: event.target.value }))}
              className="w-full rounded-md border bg-background p-3" placeholder="e.g. Auslan" />
          </div>
          <p className="text-sm text-muted-foreground">Saved preferences rank matching evidence; they do not establish service access, qualifications, worker screening, price or availability.</p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">Save preferences</button>
            <button type="button" disabled={busy} onClick={() => { void erase(); }}
              className="rounded-md border px-4 py-3 font-medium disabled:opacity-50">Erase saved preferences</button>
          </div>
          <p role="status" aria-live="polite">{message}</p>
        </form>
      )}
      <p className="text-sm">Are you a support worker? <Link className="underline" href="/worker/directory-settings">Manage whether your own worker profile is discoverable.</Link></p>
    </main>
  );
}

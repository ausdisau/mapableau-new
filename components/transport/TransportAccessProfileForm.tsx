"use client";

import { useEffect, useId, useState } from "react";

type ProfileResponse = {
  profile: {
    profileVersion: number;
    mobilityDevices: unknown;
    transferAbility: string | null;
    boardingMethod: Record<string, unknown>;
    defaultAssistance: Record<string, unknown>;
    communicationPrefs: Record<string, unknown>;
    sensoryPrefs: Record<string, unknown>;
    companionDefaults: Record<string, unknown>;
    serviceAnimal: boolean;
    safePickupNotes: string | null;
    updatedAt: string;
  } | null;
};

export function TransportAccessProfileForm() {
  const formId = useId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [transferAbility, setTransferAbility] = useState("");
  const [serviceAnimal, setServiceAnimal] = useState(false);
  const [safePickupNotes, setSafePickupNotes] = useState("");
  const [restrictedDriverNotes, setRestrictedDriverNotes] = useState("");
  const [quietRide, setQuietRide] = useState(false);
  const [doorToDoor, setDoorToDoor] = useState(false);
  const [requiresWav, setRequiresWav] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/transport/profile");
        if (!res.ok) throw new Error("Could not load profile");
        const data = (await res.json()) as ProfileResponse;
        if (cancelled) return;
        if (data.profile) {
          setTransferAbility(data.profile.transferAbility ?? "");
          setServiceAnimal(data.profile.serviceAnimal);
          setSafePickupNotes(data.profile.safePickupNotes ?? "");
          const assistance = data.profile.defaultAssistance ?? {};
          setDoorToDoor(assistance.doorToDoor === true);
          const sensory = data.profile.sensoryPrefs ?? {};
          setQuietRide(sensory.quietRide === true);
          const devices = Array.isArray(data.profile.mobilityDevices)
            ? data.profile.mobilityDevices
            : [];
          setRequiresWav(
            devices.some(
              (d) =>
                typeof d === "object" &&
                d !== null &&
                "type" in d &&
                (d.type === "manual_wheelchair" ||
                  d.type === "power_wheelchair" ||
                  d.type === "scooter")
            )
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/transport/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferAbility: transferAbility || null,
          serviceAnimal,
          safePickupNotes: safePickupNotes || null,
          restrictedDriverNotes: restrictedDriverNotes || null,
          mobilityDevices: requiresWav
            ? [{ type: "manual_wheelchair", level: "required" }]
            : [{ type: "ambulatory", level: "preferred" }],
          defaultAssistance: { doorToDoor, curbToCurb: !doorToDoor },
          sensoryPrefs: { quietRide },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      setStatus("Access profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading access profile…
      </p>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="space-y-6"
      aria-describedby={error ? `${formId}-errors` : undefined}
    >
      {error ? (
        <div
          id={`${formId}-errors`}
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          {error}
        </div>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-green-800">
          {status}
        </p>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Mobility</legend>
        <label className="flex min-h-12 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={requiresWav}
            onChange={(e) => setRequiresWav(e.target.checked)}
          />
          I need a wheelchair-accessible vehicle
        </label>
        <label className="block space-y-1 text-sm">
          <span>Transfer ability</span>
          <input
            className="w-full min-h-12 rounded-md border px-3"
            value={transferAbility}
            onChange={(e) => setTransferAbility(e.target.value)}
            placeholder="e.g. Can transfer with standby assistance"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Assistance and sensory</legend>
        <label className="flex min-h-12 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={doorToDoor}
            onChange={(e) => setDoorToDoor(e.target.checked)}
          />
          Door-to-door assistance preferred
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={quietRide}
            onChange={(e) => setQuietRide(e.target.checked)}
          />
          Quiet ride preferred
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={serviceAnimal}
            onChange={(e) => setServiceAnimal(e.target.checked)}
          />
          Travelling with a service animal
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Pickup guidance</legend>
        <label className="block space-y-1 text-sm">
          <span>Notes safe to share before assignment</span>
          <textarea
            className="w-full min-h-24 rounded-md border px-3 py-2"
            value={safePickupNotes}
            onChange={(e) => setSafePickupNotes(e.target.value)}
            maxLength={2000}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Notes only for the assigned driver</span>
          <textarea
            className="w-full min-h-24 rounded-md border px-3 py-2"
            value={restrictedDriverNotes}
            onChange={(e) => setRestrictedDriverNotes(e.target.value)}
            maxLength={2000}
          />
        </label>
      </fieldset>

      <p className="text-sm text-muted-foreground">
        Diagnosis is not collected here. Exact addresses are managed on each
        trip request, not on this profile.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {saving ? "Saving…" : "Save access profile"}
      </button>
    </form>
  );
}

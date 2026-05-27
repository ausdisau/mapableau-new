"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { FleetEligibilityBadge } from "@/components/transport/FleetEligibilityBadge";
import {
  FleetVehicleFeaturesForm,
  type FleetVehicleFeatures,
} from "@/components/transport/FleetVehicleFeaturesForm";
import { VerificationStatusList } from "@/components/transport/VerificationStatusList";
import { Button } from "@/components/ui/button";
import { checkAvVehicleSuitability } from "@/lib/av-framework/vehicle-suitability";

type VehicleDetail = {
  id: string;
  displayName: string;
  registrationNumber: string | null;
  active: boolean;
  vehicleId: string | null;
  features: FleetVehicleFeatures | null;
  verifications: Array<{
    kind: string;
    status: string;
    expiresAt: string | null;
    notes: string | null;
  }>;
  dispatchReady?: boolean;
  eligibilityReasons?: string[];
};

export function FleetVehicleEditor({
  organisationId,
  mode,
  initial,
  legacyVehicles,
}: {
  organisationId: string;
  mode: "create" | "edit";
  initial?: VehicleDetail;
  legacyVehicles?: Array<{ id: string; displayName: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(
    initial?.registrationNumber ?? ""
  );
  const [legacyVehicleId, setLegacyVehicleId] = useState(
    initial?.vehicleId ?? ""
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [features, setFeatures] = useState<FleetVehicleFeatures>(
    initial?.features ?? {
      wheelchairAccessible: false,
      rampAvailable: false,
      liftAvailable: false,
      hoistAvailable: false,
      assistanceAnimalFriendly: true,
    }
  );

  const suitabilityPreview = useMemo(() => {
    return checkAvVehicleSuitability(
      {
        requiresWheelchairAccessible: true,
        requiresRamp: false,
        requiresLift: false,
        assistanceAnimal: false,
      },
      {
        wheelchairAccessible: features.wheelchairAccessible,
        rampAvailable: features.rampAvailable,
        liftAvailable: features.liftAvailable,
        assistanceAnimalFriendly: features.assistanceAnimalFriendly,
      }
    );
  }, [features]);

  const q = `organisationId=${encodeURIComponent(organisationId)}`;

  async function saveVehicle() {
    setLoading(true);
    setError(null);
    const url =
      mode === "create"
        ? `/api/provider/transport/fleet/vehicles?${q}`
        : `/api/provider/transport/fleet/vehicles/${initial!.id}?${q}`;
    const body =
      mode === "create"
        ? {
            displayName,
            registrationNumber: registrationNumber || undefined,
            vehicleId: legacyVehicleId || undefined,
            features,
          }
        : {
            displayName,
            registrationNumber: registrationNumber || null,
            active,
            features,
          };
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const reasons = data.details?.reasons;
      setError(
        Array.isArray(reasons)
          ? reasons.join(". ")
          : data.error ?? "Could not save vehicle"
      );
      return;
    }
    const id = data.vehicle?.id ?? initial?.id;
    router.push(`/provider/transport/fleet/vehicles/${id}`);
    router.refresh();
  }

  async function patchVerifications(
    patches: Parameters<typeof VerificationStatusList>[0]["onPatch"] extends (
      p: infer P
    ) => Promise<void>
      ? P
      : never
  ) {
    if (!initial?.id) return;
    setLoading(true);
    const res = await fetch(
      `/api/provider/transport/fleet/vehicles/${initial.id}/verifications?${q}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifications: patches }),
      }
    );
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update verifications");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {mode === "edit" && initial ? (
        <div className="flex flex-wrap items-center gap-2">
          <FleetEligibilityBadge
            dispatchReady={initial.dispatchReady ?? false}
            reasons={initial.eligibilityReasons}
          />
        </div>
      ) : null}

      <AccessibleFormField id="displayName" label="Display name" required>
        <input
          id="displayName"
          className={formInputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </AccessibleFormField>

      <AccessibleFormField id="registrationNumber" label="Registration">
        <input
          id="registrationNumber"
          className={formInputClass}
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
        />
      </AccessibleFormField>

      {mode === "create" && legacyVehicles && legacyVehicles.length > 0 ? (
        <AccessibleFormField
          id="legacyVehicleId"
          label="Link legacy vehicle (optional)"
        >
          <select
            id="legacyVehicleId"
            className={formInputClass}
            value={legacyVehicleId}
            onChange={(e) => setLegacyVehicleId(e.target.value)}
          >
            <option value="">None</option>
            {legacyVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.displayName}
              </option>
            ))}
          </select>
        </AccessibleFormField>
      ) : null}

      {mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active in fleet
        </label>
      ) : null}

      <FleetVehicleFeaturesForm values={features} onChange={setFeatures} />

      {suitabilityPreview.warnings.length > 0 ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Preview (wheelchair-required trip):{" "}
          {suitabilityPreview.warnings.join(" ")}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Preview: meets basic wheelchair-accessible trip needs.
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="default"
        size="default"
        loading={loading}
        onClick={() => void saveVehicle()}
      >
        {mode === "create" ? "Add vehicle" : "Save changes"}
      </Button>

      {mode === "edit" && initial?.verifications ? (
        <section className="space-y-2 border-t border-border pt-6">
          <h2 className="font-semibold">Verifications</h2>
          <p className="text-sm text-muted-foreground">
            Mark documents verified before assigning this vehicle on dispatch.
          </p>
          <VerificationStatusList
            verifications={initial.verifications}
            onPatch={patchVerifications}
            loading={loading}
          />
        </section>
      ) : null}
    </div>
  );
}

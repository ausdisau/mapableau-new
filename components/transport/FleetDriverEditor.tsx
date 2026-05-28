"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { FleetEligibilityBadge } from "@/components/transport/FleetEligibilityBadge";
import { VerificationStatusList } from "@/components/transport/VerificationStatusList";
import { Button } from "@/components/ui/button";

type DriverDetail = {
  id: string;
  displayName: string;
  active: boolean;
  userId: string | null;
  driverProfileId: string | null;
  verifications: Array<{
    kind: string;
    status: string;
    expiresAt: string | null;
    notes: string | null;
  }>;
  dispatchReady?: boolean;
  eligibilityReasons?: string[];
};

export function FleetDriverEditor({
  organisationId,
  mode,
  initial,
}: {
  organisationId: string;
  mode: "create" | "edit";
  initial?: DriverDetail;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [userId, setUserId] = useState(initial?.userId ?? "");
  const [driverProfileId, setDriverProfileId] = useState(
    initial?.driverProfileId ?? ""
  );
  const [active, setActive] = useState(initial?.active ?? true);

  const q = `organisationId=${encodeURIComponent(organisationId)}`;

  async function saveDriver() {
    setLoading(true);
    setError(null);
    const url =
      mode === "create"
        ? `/api/provider/transport/fleet/drivers?${q}`
        : `/api/provider/transport/fleet/drivers/${initial!.id}?${q}`;
    const body =
      mode === "create"
        ? {
            displayName,
            userId: userId || undefined,
            driverProfileId: driverProfileId || undefined,
          }
        : {
            displayName,
            userId: userId || null,
            driverProfileId: driverProfileId || null,
            active,
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
          : data.error ?? "Could not save driver"
      );
      return;
    }
    const id = data.driver?.id ?? initial?.id;
    router.push(`/provider/transport/fleet/drivers/${id}`);
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
      `/api/provider/transport/fleet/drivers/${initial.id}/verifications?${q}`,
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
        <FleetEligibilityBadge
          dispatchReady={initial.dispatchReady ?? false}
          reasons={initial.eligibilityReasons}
        />
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

      <AccessibleFormField
        id="userId"
        label="Linked user ID (optional)"
        hint="MapAble user account for driver login"
      >
        <input
          id="userId"
          className={formInputClass}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="driverProfileId"
        label="Driver profile ID (optional)"
      >
        <input
          id="driverProfileId"
          className={formInputClass}
          value={driverProfileId}
          onChange={(e) => setDriverProfileId(e.target.value)}
        />
      </AccessibleFormField>

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
        onClick={() => void saveDriver()}
      >
        {mode === "create" ? "Add driver" : "Save changes"}
      </Button>

      {mode === "edit" && initial?.verifications ? (
        <section className="space-y-2 border-t border-border pt-6">
          <h2 className="font-semibold">Verifications</h2>
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

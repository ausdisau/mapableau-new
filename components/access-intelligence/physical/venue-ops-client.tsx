"use client";

import React, { useCallback, useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";

type Device = {
  deviceId: string;
  label: string;
  health: string;
  condition: string;
  online: boolean;
};

const VENUE_DEMO_HEADERS = {
  "Content-Type": "application/json",
  "x-access-role": "venue_staff",
};

export function VenueOpsClient() {
  const placeId = "place-harbour-civic";
  const [devices, setDevices] = useState<Device[]>([]);
  const [emergency, setEmergency] = useState(false);
  const [pending, setPending] = useState<
    Array<{ id: string; state: string; proposal: { actionType: string; rationale: string } }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [devRes, apprRes] = await Promise.all([
      fetch(`/api/venue/access-intelligence/${placeId}/devices`, {
        headers: VENUE_DEMO_HEADERS,
      }),
      fetch(`/api/venue/access-intelligence/${placeId}/approvals`, {
        headers: VENUE_DEMO_HEADERS,
      }),
    ]);
    const devData = await devRes.json();
    const apprData = await apprRes.json();
    if (!devRes.ok) {
      setError(devData.error || "Venue device access denied");
      return;
    }
    setDevices(devData.devices ?? []);
    setEmergency(Boolean(devData.emergency?.active));
    if (apprRes.ok) setPending(apprData.executions ?? []);
  }, [placeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEmergencyMode = async (active: boolean) => {
    const res = await fetch(`/api/venue/access-intelligence/${placeId}/emergency`, {
      method: "POST",
      headers: VENUE_DEMO_HEADERS,
      body: JSON.stringify({
        active,
        reason: active ? "Venue drill" : "Drill cleared",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Emergency update failed");
      return;
    }
    setEmergency(Boolean(data.emergency?.active));
    await refresh();
  };

  const injectOutage = async () => {
    await fetch(`/api/venue/access-intelligence/${placeId}/simulator`, {
      method: "POST",
      headers: VENUE_DEMO_HEADERS,
      body: JSON.stringify({ op: "emit", event: "main_lift_outage" }),
    });
    await refresh();
  };

  const venueApprove = async (executionId: string) => {
    const res = await fetch(`/api/venue/access-intelligence/${placeId}/approvals`, {
      method: "POST",
      headers: VENUE_DEMO_HEADERS,
      body: JSON.stringify({ executionId, note: "Venue approved (demo)" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Venue approval failed");
      return;
    }
    await refresh();
  };

  return (
    <AccessIntelligenceShell
      title="Venue Ops · Physical Systems"
      description="Harbour Civic Centre operator console for devices, emergency mode, simulator events, and venue approvals."
    >
      <FictionalBanner>
        Demo venue role header is only honoured when Access Intelligence demo mode allows role
        preview. Production requires real venue staff assignment.
      </FictionalBanner>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="default" onClick={() => void refresh()}>
          Refresh
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void setEmergencyMode(!emergency)}
        >
          {emergency ? "Clear emergency" : "Activate emergency"}
        </Button>
        <Button type="button" variant="outline" size="default" onClick={() => void injectOutage()}>
          Inject main lift outage
        </Button>
      </div>

      <p className="mt-4 text-sm" aria-live="polite">
        Emergency mode: <strong>{emergency ? "ACTIVE" : "off"}</strong>
      </p>

      <h2 className="mt-8 text-xl font-black">Devices</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {devices.map((d) => (
          <li key={d.deviceId} className="rounded-lg border border-slate-200 p-3">
            <strong>{d.label}</strong> — {d.condition} / {d.health} /{" "}
            {d.online ? "online" : "offline"}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-black">Pending approvals</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {pending.length === 0 ? (
          <li className="text-slate-600">No pending physical actions.</li>
        ) : (
          pending.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold">
                {e.proposal.actionType} · {e.state}
              </p>
              <p className="text-slate-600">{e.proposal.rationale}</p>
              {e.state === "awaiting_venue_approval" ? (
                <Button
                  type="button"
                  className="mt-2"
                  size="default"
                  variant="default"
                  onClick={() => void venueApprove(e.id)}
                >
                  Venue approve
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </AccessIntelligenceShell>
  );
}

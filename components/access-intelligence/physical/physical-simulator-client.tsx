"use client";

import React, { useCallback, useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";

const EVENTS = [
  { id: "main_lift_outage", label: "Main lift outage" },
  { id: "main_lift_restore", label: "Main lift restore" },
  { id: "door_fault", label: "Entrance B door fault" },
  { id: "door_restore", label: "Entrance B restore" },
  { id: "corridor_obstruction", label: "Corridor obstruction" },
  { id: "emergency_on", label: "Emergency on" },
  { id: "emergency_off", label: "Emergency off" },
  { id: "toilet_confirm_open", label: "Toilet confirm open" },
  { id: "toilet_unknown", label: "Toilet unknown" },
  { id: "lift_west_arrive", label: "Western lift arrive" },
  { id: "lift_west_timeout", label: "Western lift timeout" },
] as const;

type SimState = {
  emergency: { active: boolean; reason?: string };
  devices: Array<{
    deviceId: string;
    label: string;
    health: string;
    condition: string;
    online: boolean;
  }>;
  mainLiftOutage: boolean;
  doorEntBFault: boolean;
  corridorObstructed: boolean;
  eventLog: Array<{ at: string; event: string }>;
};

export function PhysicalSimulatorClient() {
  const [state, setState] = useState<SimState | null>(null);
  const [mode, setMode] = useState<string>("demo");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/access-intelligence/physical/simulator");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Simulator unavailable");
      return;
    }
    setState(data.state);
    setMode(data.configuration?.effectiveMode ?? "demo");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const emit = async (event: string) => {
    const res = await fetch("/api/access-intelligence/physical/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "emit", event }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Emit failed");
      return;
    }
    setState(data.state);
  };

  const reset = async () => {
    await fetch("/api/access-intelligence/physical/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "reset" }),
    });
    await refresh();
  };

  return (
    <AccessIntelligenceShell
      title="Physical Environment Simulator"
      description="Deterministic Harbour events for Visit / Learn / Operate drills. Live hardware remains off."
    >
      <FictionalBanner />
      <p className="text-sm text-slate-600">
        Effective mode: <strong>{mode}</strong>
      </p>
      {error ? (
        <p className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="default" onClick={() => void refresh()}>
          Refresh
        </Button>
        <Button type="button" variant="outline" size="default" onClick={() => void reset()}>
          Reset twin
        </Button>
      </div>

      <h2 className="mt-8 text-xl font-black">Inject event</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {EVENTS.map((e) => (
          <Button
            key={e.id}
            type="button"
            variant="outline"
            size="default"
            onClick={() => void emit(e.id)}
          >
            {e.label}
          </Button>
        ))}
      </div>

      {state ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-black">Devices</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {state.devices.map((d) => (
                <li key={d.deviceId} className="rounded-lg border border-slate-200 p-3">
                  <strong>{d.label}</strong>
                  <span className="ml-2 text-slate-600">
                    {d.condition} / {d.health} / {d.online ? "online" : "offline"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              Emergency: {state.emergency.active ? "ACTIVE" : "off"} · Main lift outage:{" "}
              {state.mainLiftOutage ? "yes" : "no"} · Door fault:{" "}
              {state.doorEntBFault ? "yes" : "no"} · Corridor obstructed:{" "}
              {state.corridorObstructed ? "yes" : "no"}
            </p>
          </section>
          <section>
            <h2 className="text-lg font-black">Event log</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {state.eventLog
                .slice()
                .reverse()
                .slice(0, 15)
                .map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    {e.event} · {e.at}
                  </li>
                ))}
            </ol>
          </section>
        </div>
      ) : null}
    </AccessIntelligenceShell>
  );
}

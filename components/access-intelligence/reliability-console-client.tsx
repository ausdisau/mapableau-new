"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Policy = { featureType: string; maxAgeDays: number; notes: string };
type Finding = { findingType: string; severity: string; summary: string };
type ScanResult = {
  healthScore: number;
  findings: Finding[];
  expiredFeatureTypes: string[];
};
type Task = {
  id: string;
  accessPlaceId: string;
  reason: string;
  status: string;
  dueAt: string;
};

const DEMO_FEATURES = [
  {
    id: "f-lift",
    placeId: "place-demo-reliability",
    elementId: "e1",
    featureType: "lift",
    value: true,
    sourceType: "system_feed",
    observedAt: "2020-01-01T00:00:00.000Z",
    evidenceIds: [],
    confidence: 0.5,
    disputed: false,
  },
  {
    id: "f-door-a",
    placeId: "place-demo-reliability",
    elementId: "e1",
    featureType: "clear_door_width_mm",
    value: 900,
    sourceType: "qualified_assessor",
    observedAt: "2026-01-01T00:00:00.000Z",
    evidenceIds: ["ev1"],
    confidence: 0.9,
    disputed: false,
  },
  {
    id: "f-door-b",
    placeId: "place-demo-reliability",
    elementId: "e1",
    featureType: "clear_door_width_mm",
    value: 700,
    sourceType: "community_report",
    observedAt: "2026-02-01T00:00:00.000Z",
    evidenceIds: ["ev2"],
    confidence: 0.4,
    disputed: false,
  },
];

const DEMO_EVIDENCE = [
  {
    id: "ev1",
    type: "measurement",
    title: "Door",
    capturedAt: "2026-01-01T00:00:00.000Z",
    sourceName: "Assessor",
    sourceType: "qualified_assessor",
    status: "verified",
  },
  {
    id: "ev-orphan",
    type: "photograph",
    title: "Orphan",
    capturedAt: "2026-01-01T00:00:00.000Z",
    sourceName: "Mapper",
    sourceType: "community_report",
    status: "provisional",
  },
];

export function ReliabilityConsoleClient() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [provenanceHash, setProvenanceHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/access-intelligence/reliability/scan");
    const data = await res.json();
    if (res.status === 403) {
      setEnabled(false);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not load reliability console");
      return;
    }
    setEnabled(true);
    setPolicies(data.policies ?? []);
    setTasks(data.tasks ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runScan = async (schedule: boolean) => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/access-intelligence/reliability/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: schedule ? "scan_and_schedule" : "scan",
        accessPlaceId: "place-demo-reliability",
        features: DEMO_FEATURES,
        evidence: DEMO_EVIDENCE,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Scan failed");
      return;
    }
    setResult(data.result);
    setTasks(data.tasks ?? []);
  };

  const runProvenance = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/access-intelligence/reliability/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "provenance",
        accessPlaceId: "place-demo-reliability",
        claimOrFeatureId: "f-door-a",
        steps: [
          { actorType: "assessor", summary: "Measured clear door width 900mm" },
          { actorType: "moderation", summary: "Claim accepted into ledger" },
          { actorType: "system", summary: "Linked to EvidenceAsset ev1" },
        ],
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Provenance failed");
      return;
    }
    setProvenanceHash(data.trace?.chainHash ?? null);
  };

  if (enabled === false) {
    return (
      <p role="status">
        Reliability console is off. Set{" "}
        <code>ACCESS_INTELLIGENCE_RELIABILITY_CONSOLE=true</code> to enable
        scans and queues.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="policies-heading">
        <h2 id="policies-heading" className="text-xl font-bold">
          Freshness policies
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {policies.map((p) => (
            <li key={p.featureType}>
              <strong>{p.featureType}</strong>: {p.maxAgeDays} days — {p.notes}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="actions-heading" className="flex flex-wrap gap-3">
        <h2 id="actions-heading" className="sr-only">
          Reliability actions
        </h2>
        <Button
          type="button"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() => void runScan(false)}
        >
          Run demo scan
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() => void runScan(true)}
        >
          Scan and schedule reverification
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() => void runProvenance()}
        >
          Debug provenance chain
        </Button>
      </section>

      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <section aria-labelledby="scan-heading">
          <h2 id="scan-heading" className="text-xl font-bold">
            Latest scan
          </h2>
          <p>
            Record health score:{" "}
            <strong>{(result.healthScore * 100).toFixed(0)}%</strong> (place
            record — not a person)
          </p>
          {result.expiredFeatureTypes.length ? (
            <p>
              Expired (treat as unknown):{" "}
              {result.expiredFeatureTypes.join(", ")}
            </p>
          ) : null}
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.findings.map((f, i) => (
              <li key={`${f.findingType}-${i}`}>
                [{f.severity}] {f.summary}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {provenanceHash ? (
        <p role="status">
          Provenance chain hash: <code>{provenanceHash}</code>
        </p>
      ) : null}

      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="text-xl font-bold">
          Reverification queue
        </h2>
        {tasks.length === 0 ? (
          <p>No open tasks yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="border-l-4 border-amber-600 pl-3">
                <div>
                  <strong>{t.id}</strong> — {t.status}
                </div>
                <div>{t.reason}</div>
                <div className="text-sm">Due {t.dueAt}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

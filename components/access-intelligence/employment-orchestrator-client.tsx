"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function EmploymentOrchestratorClient() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (withDiagnosis: boolean) => {
    setError(null);
    const res = await fetch("/api/access-intelligence/employment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedFields: withDiagnosis
          ? ["step_free_needed", "diagnosis"]
          : ["step_free_needed", "quiet_waiting"],
        approvedFields: ["step_free_needed"],
        interviewFormat: "in_person",
        hasAccessibleTransport: true,
        hasSupportWorker: false,
        roomRouteKnown: true,
        quietWaitingKnown: null,
        toiletKnown: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      setResult(null);
      return;
    }
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <p>
        Interview and first-day access orchestration. Never auto-rejects, never
        diagnoses, never employer risk scores. Passport fields only when
        approved.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          onClick={() => void run(false)}
        >
          Build interview checklist
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={() => void run(true)}
        >
          Reject diagnosis disclosure
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <pre className="overflow-x-auto rounded border p-3 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

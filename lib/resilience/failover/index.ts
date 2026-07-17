import { ACTIVE_ACTIVE_ENABLED, CURRENT_REGION } from "@/lib/resilience/regions";

export interface FailoverExercise {
  name: string;
  ranAt: string;
  outcome: "not_run" | "documented_only" | "successful" | "failed";
  notes?: string;
}

export function describeFailoverPosture(): FailoverExercise[] {
  return [
    {
      name: "Region failover to secondary AU region",
      ranAt: new Date().toISOString(),
      outcome: "not_run",
      notes:
        "No secondary region is live. Design document only. Do not treat as a DR guarantee.",
    },
    {
      name: "Postgres primary → replica promotion",
      ranAt: new Date().toISOString(),
      outcome: "documented_only",
      notes:
        "Runbook exists in docs/platform/wave-8-*; live exercise not part of Wave 8.",
    },
  ];
}

export function honestFailoverStatement() {
  return {
    region: CURRENT_REGION,
    activeActive: ACTIVE_ACTIVE_ENABLED,
    statement:
      "MapAble does not currently support cross-region active-active. Regional failover is design intent for a future wave.",
  };
}

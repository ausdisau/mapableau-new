import type { PilotStatus } from "@prisma/client";

export function isDrainMode(status: PilotStatus): boolean {
  return status === "draining";
}

export function allowNewWorkDuringDrain(): boolean {
  return false;
}

export function drainChecklist(): string[] {
  return [
    "Release unused reservations",
    "Complete in-flight committed transactions only",
    "Block new enrolments",
    "Complete daily review",
    "Record terminate or close decision",
  ];
}

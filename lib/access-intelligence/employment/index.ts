/**
 * System 9 — Interview and first-day accessibility orchestrator.
 * Never auto-rejects, never diagnoses, never employer risk scores.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export type EmploymentDisclosure = {
  fieldKeys: string[];
  purpose: string;
  recipient: "employer" | "recruiter" | "support_coordinator";
  consentRecordId: string;
};

export function filterApprovedFunctionalFields(input: {
  requestedFields: string[];
  approvedFields: string[];
}): { shared: string[]; omitted: string[] } {
  const approved = new Set(input.approvedFields);
  const shared = input.requestedFields.filter((f) => approved.has(f));
  const omitted = input.requestedFields.filter((f) => !approved.has(f));
  return { shared, omitted };
}

export function assertNoDiagnosisDisclosure(fields: string[]): void {
  const banned = fields.filter((f) =>
    /diagnos|condition|impairment_name|medical/i.test(f),
  );
  if (banned.length) {
    throw new Error(
      `Diagnosis-related fields cannot be shared by default: ${banned.join(", ")}`,
    );
  }
}

export function buildInterviewAccessChecklist(input: {
  interviewFormat: "in_person" | "video" | "phone";
  hasAccessibleTransport: boolean;
  hasSupportWorker: boolean;
  roomRouteKnown: boolean;
  quietWaitingKnown: boolean | null;
  toiletKnown: boolean | null;
}): {
  ready: boolean;
  items: Array<{ code: string; status: "ok" | "missing" | "unknown"; label: string }>;
} {
  const items: Array<{
    code: string;
    status: "ok" | "missing" | "unknown";
    label: string;
  }> = [
    {
      code: "transport",
      status: input.hasAccessibleTransport ? "ok" : "missing",
      label: "Accessible transport",
    },
    {
      code: "support",
      status: input.hasSupportWorker ? "ok" : "missing",
      label: "Support worker or job coach",
    },
    {
      code: "room_route",
      status: input.roomRouteKnown ? "ok" : "missing",
      label: "Interview room route",
    },
    {
      code: "quiet_waiting",
      status:
        input.quietWaitingKnown === null
          ? "unknown"
          : input.quietWaitingKnown
            ? "ok"
            : "missing",
      label: "Quiet waiting space",
    },
    {
      code: "toilet",
      status:
        input.toiletKnown === null
          ? "unknown"
          : input.toiletKnown
            ? "ok"
            : "missing",
      label: "Accessible toilet",
    },
    {
      code: "format",
      status: "ok",
      label: `Interview format: ${input.interviewFormat}`,
    },
  ];

  const ready = items.every((i) => i.status !== "missing");
  return { ready, items };
}

export function assertEmploymentOrchestratorEnabled(): void {
  if (!accessIntelligenceFlags.employmentOrchestrator) {
    throw new Error("Employment access orchestrator disabled.");
  }
}

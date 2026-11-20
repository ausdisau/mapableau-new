import { z } from "zod";

import { recordReconciliationObservation } from "@/lib/integrations/delivery/reconciliation-service";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { deputyFetch } from "@/lib/integrations/deputy/client";

export const deputyTimesheetHintSchema = z.object({
  organisationId: z.string(),
  externalTimesheetId: z.string(),
  employeeId: z.string().optional(),
  startUnix: z.number().optional(),
  endUnix: z.number().optional(),
  approved: z.boolean().optional(),
  raw: z.unknown().optional(),
});

export type DeputyTimesheetHint = z.infer<typeof deputyTimesheetHintSchema>;

/**
 * Read approved timesheets as *hints* only.
 * Payroll approval ≠ participant acceptance of service or billing approval.
 */
export async function fetchDeputyTimesheetHint(input: {
  organisationId: string;
  timesheetId: string;
}): Promise<{
  hint: DeputyTimesheetHint;
  requiresMapAbleReview: true;
  autoApprovedForBilling: false;
}> {
  if (!integrationsFeatureFlags.deputyEnabled()) {
    throw new Error("DEPUTY_ENABLED is false");
  }

  if (integrationsFeatureFlags.dryRun()) {
    return {
      hint: {
        organisationId: input.organisationId,
        externalTimesheetId: input.timesheetId,
        approved: false,
        raw: { dryRun: true },
      },
      requiresMapAbleReview: true,
      autoApprovedForBilling: false,
    };
  }

  // Resource GET — exact resource path may vary by Deputy version; treat as authenticated refetch.
  const res = await deputyFetch(
    `/api/v1/resource/Timesheet/${encodeURIComponent(input.timesheetId)}`,
    { method: "GET", organisationId: input.organisationId },
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Deputy timesheet fetch failed: HTTP ${res.status}`);
  }

  const obj = (res.json ?? {}) as Record<string, unknown>;
  const hint = deputyTimesheetHintSchema.parse({
    organisationId: input.organisationId,
    externalTimesheetId: input.timesheetId,
    employeeId:
      obj.Employee != null
        ? String(obj.Employee)
        : obj.intEmployeeId != null
          ? String(obj.intEmployeeId)
          : undefined,
    startUnix:
      typeof obj.StartTime === "number"
        ? obj.StartTime
        : typeof obj.intStartTime === "number"
          ? obj.intStartTime
          : undefined,
    endUnix:
      typeof obj.EndTime === "number"
        ? obj.EndTime
        : typeof obj.intEndTime === "number"
          ? obj.intEndTime
          : undefined,
    approved: Boolean(obj.IsApproved ?? obj.blnApproved ?? false),
    raw: obj,
  });

  await recordReconciliationObservation({
    provider: "deputy",
    organisationId: input.organisationId,
    observedRemoteStatus: hint.approved ? "timesheet_approved" : "timesheet_unapproved",
    discrepancyType: "timesheet_hint",
    lastResult: "fetched_hint_requires_review",
    metadataJson: {
      externalTimesheetId: hint.externalTimesheetId,
      note: "Do not treat Deputy payroll approval as participant billing acceptance",
    },
  });

  return {
    hint,
    requiresMapAbleReview: true,
    autoApprovedForBilling: false,
  };
}

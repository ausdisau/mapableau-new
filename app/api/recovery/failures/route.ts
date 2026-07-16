import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isFailureDetectionEnabled } from "@/lib/continuity-os/feature-flags";
import { reportServiceFailure } from "@/lib/continuity-os/failures/failure-service";

const schema = z.object({
  missionId: z.string().optional(),
  trigger: z.enum([
    "support_worker_cancellation",
    "worker_no_show",
    "accessible_transport_cancellation",
    "inaccessible_replacement_vehicle",
    "venue_closure",
    "lift_outage",
    "equipment_breakdown",
    "equipment_delivery_delay",
    "provider_withdrawal",
    "inaccessible_document",
    "unexpected_fee",
    "failed_refund",
    "lost_device",
    "account_compromise",
    "privacy_incident",
    "handoff_rejected",
    "regional_capacity_shortage",
    "family_violence_safe_mode",
    "participant_report",
    "other",
  ]),
  summary: z.string().min(1),
  serviceDomain: z.string().min(1),
  serviceRefType: z.string().optional(),
  serviceRefId: z.string().optional(),
  observedAt: z.string().datetime().optional(),
  sourceType: z.string().min(1),
  sourceLabel: z.string().optional(),
  essentialServiceImpact: z.boolean().optional(),
  timeSensitive: z.boolean().optional(),
  noAlternative: z.boolean().optional(),
  safetyConcern: z.boolean().optional(),
  hardRequirementFailed: z.boolean().optional(),
  dependentNodeCount: z.number().int().optional(),
  affectedDependencyCode: z.string().optional(),
});

export const POST = withContinuityHandler(async (user, request) => {
  const disabled = disabledIf(
    isFailureDetectionEnabled(),
    "FAILURE_DETECTION_DISABLED"
  );
  if (disabled) return disabled;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ContinuityOsError("VALIDATION_FAILED", "Invalid failure report.", 400);
  }

  const result = await reportServiceFailure({
    participantId: user.id,
    actorUserId: user.id,
    ...parsed.data,
    observedAt: parsed.data.observedAt
      ? new Date(parsed.data.observedAt)
      : undefined,
  });

  return Response.json(result, { status: 201 });
});

import { accessExperienceFlags } from "@/lib/access/experience/flags";
import type { QuickObservationType } from "@/lib/access/experience/quick-observation-types";
import { QUICK_OBSERVATION_LABELS } from "@/lib/access/experience/quick-observation-types";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { createAccessObservation } from "@/lib/access/infrastructure/observation-service";
import { reportAccessPlace } from "@/lib/access/map/access-place-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export class QuickObservationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "QuickObservationError";
    this.status = status;
  }
}

export type SubmitQuickObservationInput = {
  placeId: string;
  reporterId: string;
  observationType: QuickObservationType;
  value?: "yes" | "no" | "not_sure";
  note?: string;
};

function observationValue(input: SubmitQuickObservationInput): boolean | string {
  if (input.value === "yes") return true;
  if (input.value === "no") return false;
  if (input.value === "not_sure") return "unknown";
  return QUICK_OBSERVATION_LABELS[input.observationType];
}

export async function submitQuickObservation(input: SubmitQuickObservationInput) {
  if (!accessExperienceFlags.enabled) {
    throw new QuickObservationError("Access Experience 2.0 is disabled", 404);
  }

  const summary = [
    QUICK_OBSERVATION_LABELS[input.observationType],
    input.value ? `Answer: ${input.value}` : null,
    input.note ? `Note: ${input.note}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  let observationId: string | undefined;

  if (accessInfrastructureFlags.graphApisEnabled) {
    const envelope = await createAccessObservation({
      featureKey: input.observationType,
      ontologyConceptId: `quick_observation.${input.observationType}`,
      value: observationValue(input),
      sourceType: "community",
      placeId: input.placeId,
      observerUserId: input.reporterId,
      evidenceKinds: ["community_observation"],
    });
    observationId = envelope.id;
  } else {
    await reportAccessPlace({
      placeId: input.placeId,
      reporterId: input.reporterId,
      reason: "inaccurate_access_information",
      details: summary,
    });
  }

  await createAuditEvent({
    actorUserId: input.reporterId,
    action: "access.observation.created",
    entityType: "AccessPlace",
    entityId: input.placeId,
    metadata: {
      observationType: input.observationType,
      channel: accessInfrastructureFlags.graphApisEnabled
        ? "access_graph"
        : "place_report",
      observationId,
    },
  });

  return {
    ok: true as const,
    channel: accessInfrastructureFlags.graphApisEnabled
      ? ("access_graph" as const)
      : ("place_report" as const),
    message:
      "Your observation was submitted for review. It is community-reported evidence, not immediate verification.",
  };
}

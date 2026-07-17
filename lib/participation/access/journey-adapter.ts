import { createJourneyPlan } from "@/lib/accessops/journeys/journey-planner";

export interface ParticipationJourneyReferenceInput {
  participantId?: string;
  tenantId?: string;
  origin?: Record<string, unknown>;
  destination?: Record<string, unknown>;
  departureWindow?: Record<string, unknown>;
  createRealJourney?: boolean;
}

export interface ParticipationJourneyReference {
  accessJourneyPlanId: string | null;
  uncertainty: string;
}

export async function createParticipationJourneyReference(
  input: ParticipationJourneyReferenceInput,
): Promise<ParticipationJourneyReference> {
  if (
    input.createRealJourney &&
    input.origin &&
    input.destination &&
    input.departureWindow
  ) {
    const journey = await createJourneyPlan({
      requestId: `participation-${Date.now()}`,
      participantId: input.participantId,
      tenantId: input.tenantId,
      origin: input.origin,
      destination: input.destination,
      departureWindow: input.departureWindow,
      routeOptions: [],
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      statusSnapshotId: "participation-stub",
    });
    return {
      accessJourneyPlanId: journey.id,
      uncertainty: "AccessOps journey planner returned a referenced plan.",
    };
  }
  return {
    accessJourneyPlanId: null,
    uncertainty:
      "Journey planning is uncertain until AccessOps route data is available and participant-approved.",
  };
}

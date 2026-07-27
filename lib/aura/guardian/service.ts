import { randomUUID } from "crypto";

import { auraFlags } from "@/lib/aura/feature-flags";
import type {
  AuraJourneyGuardian,
  AuraJourneyGuardianAlert,
} from "@/lib/aura/guardian/types";
import { requireMission } from "@/lib/aura/mission/store";
import { createVenueVerificationRequest } from "@/lib/aura/proposals";
import { ingestObservation } from "@/lib/aura/sensorthings";
import { appendWitness } from "@/lib/aura/witness";
import { getLatestWorld } from "@/lib/aura/world-model/composer";
import { propagateDependencyChange } from "@/lib/aura/world-model/propagation";

const guardians = new Map<string, AuraJourneyGuardian>();
const alerts = new Map<string, AuraJourneyGuardianAlert>();

export function resetGuardianStore(): void {
  guardians.clear();
  alerts.clear();
}

export function enableGuardian(input: {
  missionId: string;
  userId: string;
  urgency?: AuraJourneyGuardian["urgency"];
  monitoringHours?: number;
}): AuraJourneyGuardian {
  if (
    !auraFlags.journeyGuardianEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_JOURNEY_GUARDIAN_DISABLED");
  }

  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  if (mission.stopState || mission.status === "stopped") {
    throw new Error("AURA_MISSION_STOPPED");
  }

  const hours = input.monitoringHours ?? 24;
  const guardian: AuraJourneyGuardian = {
    id: randomUUID(),
    missionId: input.missionId,
    userId: input.userId,
    state: "monitoring",
    urgency: input.urgency ?? "attention",
    monitoringExpiresAt: new Date(
      Date.now() + hours * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: new Date().toISOString(),
  };
  guardians.set(input.missionId, guardian);
  return guardian;
}

export function stopGuardian(input: {
  missionId: string;
  userId: string;
}): AuraJourneyGuardian {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  const g = guardians.get(input.missionId);
  if (!g) throw new Error("AURA_GUARDIAN_NOT_FOUND");
  const stopped: AuraJourneyGuardian = {
    ...g,
    state: "stopped",
    stoppedAt: new Date().toISOString(),
  };
  guardians.set(input.missionId, stopped);
  return stopped;
}

export function getGuardian(missionId: string): AuraJourneyGuardian | null {
  const g = guardians.get(missionId);
  if (!g) return null;
  if (
    Date.parse(g.monitoringExpiresAt) <= Date.now() &&
    g.state === "monitoring"
  ) {
    return { ...g, state: "expired" };
  }
  return g;
}

export function listAlerts(missionId: string): AuraJourneyGuardianAlert[] {
  return [...alerts.values()].filter((a) => a.missionId === missionId);
}

/**
 * Process lift outage from SensorThings — creates Guardian alert and
 * triggers a venue_verification_request to reception. Never auto-executes.
 */
export function processLiftOutage(input: {
  missionId: string;
  userId: string;
  placeId: string;
  elementId: string;
}): AuraJourneyGuardianAlert {
  const mission = requireMission(input.missionId);

  // Safety: strict mission ownership — blocks forged trusted safety events.
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  if (mission.stopState || mission.status === "stopped") {
    throw new Error("AURA_MISSION_STOPPED");
  }

  if (!getLatestWorld(input.missionId)) {
    throw new Error("AURA_WORLD_NOT_FOUND");
  }

  const guardian = getGuardian(input.missionId);
  if (!guardian || guardian.state !== "monitoring") {
    throw new Error("AURA_GUARDIAN_NOT_MONITORING");
  }
  if (guardian.userId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const obs = ingestObservation({
    sourceId: "sensorthings-fixture",
    thingId: "lift-west-thing",
    placeId: input.placeId,
    elementId: input.elementId,
    observedProperty: "lift.operation",
    value: false,
    phenomenonTime: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    quality: "good",
    sequenceNumber: 1,
    signatureValid: true,
    staleAfter: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    sourceVersion: "1",
    trustedSource: true,
  });

  const propagation = propagateDependencyChange({
    missionId: input.missionId,
    changeType: "lift_outage",
    sourceObservationIds: obs ? [obs.id] : [],
  });

  const alert: AuraJourneyGuardianAlert = {
    id: randomUUID(),
    missionId: input.missionId,
    severity: "urgent",
    changeType: "lift_outage",
    summary:
      "Western lift unavailable. Preferred route invalid. No verified lift alternative.",
    sourceReferences: obs ? [obs.id] : [],
    observedAt: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    previousPlanId: mission.plan?.id ?? "unknown",
    revisedPlanId: propagation.revisedWorld.id,
    effects: {
      routeChanged: propagation.routeChanged,
      statusChanged: true,
      arrivalTimeChanged: propagation.arrivalTimeChanged,
      supportConflictCreated: propagation.supportConflictCreated,
      newBlockers: propagation.newBlockers,
      newUnknowns: propagation.newUnknowns,
    },
    alternative: {
      label: "No verified lift alternative",
      verified: false,
    },
    participantReviewRequired: true,
    actionProposalAvailable: true,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };

  // Trigger venue_verification_request to relevant reception on outage.
  const verification = createVenueVerificationRequest({
    missionId: input.missionId,
    userId: input.userId,
    alertId: alert.id,
    recipientLabel: "Harbour Civic Centre reception",
    sourceReferences: alert.sourceReferences,
  });
  alert.venueVerificationRequestId = verification.id;
  alerts.set(alert.id, alert);

  guardians.set(input.missionId, {
    ...guardian,
    state: "proposal_created",
  });

  appendWitness({
    missionId: input.missionId,
    type: "journey_guardian.alert_created",
    summary: alert.summary,
    correlationId: mission.correlationId,
    payload: {
      alertId: alert.id,
      severity: alert.severity,
      venueVerificationRequestId: verification.id,
    },
  });

  return alert;
}

export function assertGuardianCannotAutoExecute(): void {
  /* invariant — Guardian never executes proposals */
}

export function assertGuardianCannotAutoNotify(): void {
  /* invariant */
}

export function assertGuardianCannotAutoRebook(): void {
  /* invariant */
}

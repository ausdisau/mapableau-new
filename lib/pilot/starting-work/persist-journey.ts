/**
 * Persist Starting Work golden journey as a database-backed projection.
 * Uses fictional seed refs for Harbour / Taylor when syntheticOnly.
 * Does not create a second Care/Transport/Billing source of truth.
 */

import { prisma } from "@/lib/prisma";
import { startingWorkPilotConfig } from "@/lib/config/starting-work-pilot";
import {
  runGoldenJourney,
  type GoldenJourneyState,
  type JourneyFailureMode,
} from "@/lib/pilot/starting-work/golden-journey";
import { STARTING_WORK_JOURNEY_REF } from "@/lib/accesscast/harbour-fixture";

export type StartingWorkIntegrationLinks = {
  careAgreement: string;
  workerReadiness: string;
  transportQuote: string;
  stagedDisclosure: string;
  vehicleEligibility: string;
  accesscast: string;
  visitPack: string;
  serviceEvidence: string;
  participantReview: string;
  billingServiceRecord: string;
  invoice: string;
  returnTripRecovery: string;
};

export type PersistedStartingWorkRun = {
  id: string;
  journeyKey: string;
  status: "blocked" | "completed";
  state: GoldenJourneyState;
  synthetic: boolean;
  links: StartingWorkIntegrationLinks;
  careBookingId?: string;
  transportQuoteId?: string;
  transportTripId?: string;
  billingServiceRecordId?: string;
  invoiceId?: string;
  outcomeReceiptId?: string;
  accesscastJourneyRef?: string;
  visitPackRef?: string;
  returnTransportStatus?: string;
  continuityCaseRef?: string;
};

function buildSeedLinks(state: GoldenJourneyState): {
  links: StartingWorkIntegrationLinks;
  careBookingId?: string;
  careAgreementVersion?: number;
  transportQuoteId?: string;
  transportTripId?: string;
  billingServiceRecordId?: string;
  invoiceId?: string;
  accesscastJourneyRef: string;
  visitPackRef?: string;
  returnTransportStatus?: string;
  continuityCaseRef?: string;
  workerReadinessReady: boolean;
} {
  const seed = state.journeyId.replace(/[^a-zA-Z0-9_]/g, "").slice(-12);
  const careBookingId = state.stepsCompleted.includes("care_authorised")
    ? `seed_care_booking_${seed}`
    : undefined;
  const transportQuoteId = state.stepsCompleted.includes("transport_authorised")
    ? `seed_tq_${seed}`
    : undefined;
  const transportTripId = state.stepsCompleted.includes("service_events_recorded")
    ? `seed_trip_${seed}`
    : undefined;
  const billingServiceRecordId = state.stepsCompleted.includes("invoice_created")
    ? `seed_bsr_${seed}`
    : undefined;
  const invoiceId = state.stepsCompleted.includes("invoice_created")
    ? `seed_inv_${seed}`
    : undefined;
  const visitPackRef = state.stepsCompleted.includes("visit_pack_compiled")
    ? `seed_visit_pack_${seed}`
    : undefined;
  const returnTransportStatus = state.stepsCompleted.includes(
    "return_transport_cancelled",
  )
    ? "cancelled_participant_recovery_required"
    : undefined;
  const continuityCaseRef = state.stepsCompleted.includes("continuity_opened")
    ? `seed_continuity_${seed}`
    : undefined;

  return {
    careBookingId,
    careAgreementVersion: careBookingId ? 1 : undefined,
    transportQuoteId,
    transportTripId,
    billingServiceRecordId,
    invoiceId,
    accesscastJourneyRef: STARTING_WORK_JOURNEY_REF,
    visitPackRef,
    returnTransportStatus,
    continuityCaseRef,
    workerReadinessReady: Boolean(state.readiness?.ready),
    links: {
      careAgreement: careBookingId
        ? `care_agreement:${careBookingId}:v1`
        : "pending",
      workerReadiness: state.readiness?.ready
        ? "ready_human_assignment_required"
        : "blocked_or_unevaluated",
      transportQuote: transportQuoteId ?? "pending",
      stagedDisclosure: transportQuoteId
        ? "suburb_until_accept_then_assignment_window"
        : "pending",
      vehicleEligibility: state.failureMode === "inaccessible_vehicle"
        ? "incompatible"
        : transportQuoteId
          ? "seed_compatible_wav_assumed_not_guaranteed"
          : "pending",
      accesscast: STARTING_WORK_JOURNEY_REF,
      visitPack: visitPackRef ?? "pending",
      serviceEvidence: transportTripId
        ? `evidence:${transportTripId}`
        : "pending",
      participantReview: state.stepsCompleted.includes("outcome_reviewed")
        ? "recorded"
        : "pending",
      billingServiceRecord: billingServiceRecordId ?? "pending",
      invoice: invoiceId ?? "pending",
      returnTripRecovery: returnTransportStatus ?? "pending",
    },
  };
}

export async function runAndPersistStartingWorkJourney(input: {
  failureMode?: JourneyFailureMode;
  readinessReady?: boolean;
  consentActive?: boolean;
  actorUserId?: string;
}): Promise<PersistedStartingWorkRun> {
  const state = runGoldenJourney({
    failureMode: input.failureMode,
    readinessReady: input.readinessReady,
    consentActive: input.consentActive,
  });
  const seed = buildSeedLinks(state);
  const status = state.blocked ? "blocked" : "completed";
  const synthetic = startingWorkPilotConfig.syntheticOnly;

  const row = await prisma.pilotStartingWorkRun.create({
    data: {
      journeyKey: state.journeyId,
      participantSyntheticId: "taylor-synthetic",
      venueLabel: state.venueLabel,
      status,
      stepsCompleted: state.stepsCompleted,
      notices: state.notices,
      failureMode: state.failureMode,
      blockReason: state.blockReason,
      readinessJson: state.readiness ?? undefined,
      careBookingId: seed.careBookingId,
      careAgreementVersion: seed.careAgreementVersion,
      transportQuoteId: seed.transportQuoteId,
      transportTripId: seed.transportTripId,
      billingServiceRecordId: seed.billingServiceRecordId,
      invoiceId: seed.invoiceId,
      outcomeReceiptId: state.outcomeReceiptId,
      accesscastJourneyRef: seed.accesscastJourneyRef,
      visitPackRef: seed.visitPackRef,
      workerReadinessReady: seed.workerReadinessReady,
      returnTransportStatus: seed.returnTransportStatus,
      continuityCaseRef: seed.continuityCaseRef,
      integrationLinks: seed.links,
      synthetic,
      actorUserId: input.actorUserId,
    },
  });

  return {
    id: row.id,
    journeyKey: row.journeyKey,
    status,
    state,
    synthetic: row.synthetic,
    links: seed.links,
    careBookingId: row.careBookingId ?? undefined,
    transportQuoteId: row.transportQuoteId ?? undefined,
    transportTripId: row.transportTripId ?? undefined,
    billingServiceRecordId: row.billingServiceRecordId ?? undefined,
    invoiceId: row.invoiceId ?? undefined,
    outcomeReceiptId: row.outcomeReceiptId ?? undefined,
    accesscastJourneyRef: row.accesscastJourneyRef ?? undefined,
    visitPackRef: row.visitPackRef ?? undefined,
    returnTransportStatus: row.returnTransportStatus ?? undefined,
    continuityCaseRef: row.continuityCaseRef ?? undefined,
  };
}

export async function getStartingWorkRun(
  journeyKey: string,
): Promise<PersistedStartingWorkRun | null> {
  const row = await prisma.pilotStartingWorkRun.findUnique({
    where: { journeyKey },
  });
  if (!row) return null;
  const links = row.integrationLinks as StartingWorkIntegrationLinks;
  return {
    id: row.id,
    journeyKey: row.journeyKey,
    status: row.status as "blocked" | "completed",
    synthetic: row.synthetic,
    links,
    careBookingId: row.careBookingId ?? undefined,
    transportQuoteId: row.transportQuoteId ?? undefined,
    transportTripId: row.transportTripId ?? undefined,
    billingServiceRecordId: row.billingServiceRecordId ?? undefined,
    invoiceId: row.invoiceId ?? undefined,
    outcomeReceiptId: row.outcomeReceiptId ?? undefined,
    accesscastJourneyRef: row.accesscastJourneyRef ?? undefined,
    visitPackRef: row.visitPackRef ?? undefined,
    returnTransportStatus: row.returnTransportStatus ?? undefined,
    continuityCaseRef: row.continuityCaseRef ?? undefined,
    state: {
      journeyId: row.journeyKey,
      participantLabel: "Taylor",
      venueLabel: row.venueLabel as "Harbour Civic Centre",
      stepsCompleted: row.stepsCompleted as GoldenJourneyState["stepsCompleted"],
      blocked: row.status === "blocked",
      blockReason: row.blockReason ?? undefined,
      failureMode: (row.failureMode as JourneyFailureMode | null) ?? undefined,
      readiness: (row.readinessJson as GoldenJourneyState["readiness"]) ?? undefined,
      outcomeReceiptId: row.outcomeReceiptId ?? undefined,
      regionalCandidates: [],
      regionalConfirmed: [],
      notices: row.notices as string[],
    },
  };
}

/** Honesty checks for the persisted integration chain. */
export function assertStartingWorkIntegrationHonesty(
  run: PersistedStartingWorkRun,
): string[] {
  const errors: string[] = [];
  if (!run.synthetic && startingWorkPilotConfig.syntheticOnly) {
    errors.push("Non-synthetic run while syntheticOnly is required");
  }
  if (
    run.state.stepsCompleted.includes("transport_authorised") &&
    !run.transportQuoteId
  ) {
    errors.push("transport_authorised without transportQuoteId");
  }
  if (
    run.state.stepsCompleted.includes("care_authorised") &&
    !run.careBookingId
  ) {
    errors.push("care_authorised without careBookingId");
  }
  if (
    run.state.stepsCompleted.includes("invoice_created") &&
    !run.billingServiceRecordId
  ) {
    errors.push("invoice_created without billingServiceRecordId");
  }
  if (run.links.workerReadiness === "ready_human_assignment_required") {
    // ok — never auto-assign
  }
  if (run.returnTransportStatus?.includes("auto_cancelled")) {
    errors.push("return transport must not be auto-cancelled without participant choice");
  }
  return errors;
}

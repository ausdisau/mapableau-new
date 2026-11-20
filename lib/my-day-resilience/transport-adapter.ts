import {
  normalizeMobilityRequirements,
  type MobilityRequirements,
} from "@/lib/transport/mobility-schema";
import {
  ACCESS_OBSERVATIONS,
  TRANSPORT_BASELINE_EVIDENCE,
} from "@/lib/my-day-resilience/fixtures";
import type {
  Proposal,
  SourceEvidence,
} from "@/lib/my-day-resilience/types";

/**
 * P06 synthetic transport recovery adapter.
 * Advisory only — no dispatch, GPS, booking or operator integration.
 */

export type TransportDisruptionKind =
  | "delayed_pickup"
  | "vehicle_mismatch"
  | "lift_outage"
  | "inaccessible_dropoff";

export type SyntheticTripProposal = {
  tripId: string;
  linkedStepIds: string[];
  mobility: MobilityRequirements;
  routeHonesty: SourceEvidence["honesty"];
  advisoryEstimateMinutes: number;
  evidence: SourceEvidence[];
  booked: false;
  canDispatch: false;
};

export function buildBaselineTrip(input: {
  linkedStepIds: string[];
  requiresWheelchairAccessible: boolean;
}): SyntheticTripProposal {
  const mobility = normalizeMobilityRequirements({
    requiresWheelchairAccessible: input.requiresWheelchairAccessible,
    requiresRamp: true,
    needsExtraBoardingTime: true,
    driverAssistanceRequired: true,
    mobilityAidNotes: "Synthetic wheelchair footprint (declared).",
  });

  return {
    tripId: "trip_synthetic_outbound",
    linkedStepIds: input.linkedStepIds,
    mobility,
    routeHonesty: "declared",
    advisoryEstimateMinutes: 35,
    evidence: [...TRANSPORT_BASELINE_EVIDENCE, ...ACCESS_OBSERVATIONS],
    booked: false,
    canDispatch: false,
  };
}

export function evaluateTransportDisruption(
  kind: TransportDisruptionKind,
  baseline: SyntheticTripProposal,
): {
  trip: SyntheticTripProposal;
  evidence: SourceEvidence[];
  routeStatus: "unknown" | "unavailable" | "delayed";
} {
  switch (kind) {
    case "delayed_pickup":
      return {
        trip: {
          ...baseline,
          advisoryEstimateMinutes: baseline.advisoryEstimateMinutes + 25,
        },
        evidence: [
          {
            id: "ev_delayed_pickup",
            topic: "Pickup timing",
            honesty: "fictional",
            summary:
              "Synthetic delay: pickup projected 25 minutes late. Advisory only; no live vehicle tracking.",
            capabilityClaim: "in_development",
          },
        ],
        routeStatus: "delayed",
      };
    case "vehicle_mismatch":
      return {
        trip: baseline,
        evidence: [
          {
            id: "ev_vehicle_mismatch",
            topic: "Vehicle compatibility",
            honesty: "unknown",
            summary:
              "Fictional vehicle does not document ramp capacity matching the declared mobility aid. Incompatible vehicle must not be confirmed.",
            capabilityClaim: "in_development",
          },
        ],
        routeStatus: "unavailable",
      };
    case "lift_outage":
      return {
        trip: baseline,
        evidence: [
          {
            id: "ev_lift_outage",
            topic: "Station or venue lift",
            honesty: "unknown",
            summary:
              "Lift outage injected in scenario. Accessible route flagged unknown/unavailable. No safety guarantee.",
            capabilityClaim: "in_development",
          },
        ],
        routeStatus: "unavailable",
      };
    case "inaccessible_dropoff":
      return {
        trip: baseline,
        evidence: [
          {
            id: "ev_dropoff_block",
            topic: "Drop-off access",
            honesty: "unknown",
            summary:
              "Drop-off path accessibility is unknown after disruption. Human-assisted recovery required before any real travel change.",
            capabilityClaim: "in_development",
          },
        ],
        routeStatus: "unavailable",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function buildTransportRecoveryProposals(input: {
  disruption: TransportDisruptionKind;
  declinedProposalIds: string[];
  routeStatus: "unknown" | "unavailable" | "delayed";
}): Proposal[] {
  const proposals: Proposal[] = [];

  if (input.routeStatus === "delayed") {
    const id = "proposal_wait_delayed_transport";
    if (!input.declinedProposalIds.includes(id)) {
      proposals.push({
        id,
        kind: "preserve_arrangement",
        label: "Keep the proposed trip and allow extra buffer time",
        explanation:
          "Synthetic delay only. Consent is not overwritten. No booking change is executed.",
        evidence: [
          {
            id: "ev_buffer",
            topic: "Journey buffer",
            honesty: "declared",
            summary: "Participant may accept additional wait time (declared choice).",
            capabilityClaim: "in_development",
          },
        ],
        verifiedInScenario: false,
        canExecute: false,
        requiresParticipantApproval: true,
        humanReviewRequired: true,
      });
    }
  }

  if (
    input.routeStatus === "unavailable" ||
    input.disruption === "vehicle_mismatch"
  ) {
    const id = "proposal_alternate_accessible_vehicle";
    if (!input.declinedProposalIds.includes(id)) {
      proposals.push({
        id,
        kind: "alternate_transport",
        label: "Review an alternate accessible vehicle option (scenario only)",
        explanation:
          "Alternate vehicle is labelled fictional / needs confirmation. Not verified for boarding method or tie-down. Cannot be confirmed as compatible without human review.",
        evidence: [
          {
            id: "ev_alt_vehicle",
            topic: "Alternate vehicle",
            honesty: "fictional",
            summary:
              "Fictional alternate vehicle listed for discussion. verifiedInScenario=false.",
            capabilityClaim: "in_development",
          },
        ],
        verifiedInScenario: false,
        canExecute: false,
        requiresParticipantApproval: true,
        humanReviewRequired: true,
      });
    }
  }

  proposals.push({
    id: "proposal_human_transport_escalation",
    kind: "human_coordination",
    label: "Request human-assisted transport recovery",
    explanation:
      "When no verified accessible alternative exists, escalate to a human coordinator. No autonomous dispatch.",
    evidence: [
      {
        id: "ev_no_verified_trip",
        topic: "Verified transport alternative",
        honesty: "unknown",
        summary: "No independently verified accessible trip alternative in scenario.",
        capabilityClaim: "in_development",
      },
    ],
    verifiedInScenario: false,
    canExecute: false,
    requiresParticipantApproval: true,
    humanReviewRequired: true,
  });

  return proposals.filter((p) => !input.declinedProposalIds.includes(p.id));
}

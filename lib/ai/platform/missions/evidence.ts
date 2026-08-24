import type { MapAbleMissionRequest } from "./types";
import type { EvidenceBundle, EvidenceItem } from "./types";

function evidenceId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

/**
 * Build evidence bundle from participant input and consent state.
 * Does not invent verified system records — missing data is explicit.
 */
export function buildMissionEvidenceBundle(
  request: MapAbleMissionRequest,
): EvidenceBundle {
  const participantSupplied: EvidenceItem[] = [
    {
      id: evidenceId("participant-objective"),
      origin: "participant_input",
      label: "Participant objective",
      detail: request.objective,
      verified: false,
      observationDate: null,
      verificationState: null,
      limitations: ["Self-reported goal — not independently verified"],
      stale: false,
    },
  ];

  if (request.lifeIntentId) {
    participantSupplied.push({
      id: evidenceId("life-intent-ref"),
      origin: "life_intent",
      label: "Linked Life Intent",
      detail: `LifeIntent reference ${request.lifeIntentId}`,
      verified: false,
      observationDate: null,
      verificationState: null,
      limitations: ["Reference only — expression stored separately and never AI-overwritten"],
      stale: false,
    });
  }

  const missing: string[] = [];
  const systemSupplied: EvidenceItem[] = [];

  if (request.requestedUseOfAccessibilityProfile) {
    if (request.profileConsentGranted) {
      systemSupplied.push({
        id: evidenceId("profile-consent"),
        origin: "participant_profile",
        label: "Accessibility profile (consented)",
        detail: "Functional mobility and communication preferences may be used.",
        verified: false,
        observationDate: null,
        verificationState: "consent_granted",
        limitations: ["Profile contents not copied into mission context"],
        stale: false,
      });
    } else {
      missing.push("accessibility_profile_consent");
    }
  }

  missing.push("calendar_event", "transport_booking", "care_assignment", "workplace_access_audit");

  return {
    verified: [],
    participantSupplied,
    systemSupplied,
    inferred: [],
    conflicting: [],
    stale: [],
    missing,
  };
}

export function addAccessEvidenceConflict(bundle: EvidenceBundle): EvidenceBundle {
  const participantReport: EvidenceItem = {
    id: evidenceId("access-participant"),
    origin: "access_observation",
    label: "Participant access report",
    detail: "Lift reported working on last visit.",
    verified: false,
    observationDate: "2026-07-01",
    verificationState: "participant_report",
    limitations: ["Not verified by independent audit"],
    stale: false,
  };
  const providerReport: EvidenceItem = {
    id: evidenceId("access-provider"),
    origin: "provider_record",
    label: "Provider access report",
    detail: "Lift marked out of service.",
    verified: false,
    observationDate: "2026-07-15",
    verificationState: "provider_report",
    limitations: ["May be stale"],
    stale: false,
  };
  return {
    ...bundle,
    conflicting: [
      {
        items: [participantReport, providerReport],
        note: "Conflicting lift status — both sources preserved; no automatic reconciliation.",
      },
    ],
  };
}

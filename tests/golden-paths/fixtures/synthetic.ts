import { syntheticCurrentUser } from "@/lib/release-candidate/context/participant-context";
import { buildSyntheticReleaseCandidateRequestContext } from "@/lib/release-candidate/context/request-context";

export const SYNTH_IDS = {
  participantUserId: "SYNTH_PARTICIPANT_001",
  providerUserId: "SYNTH_PROVIDER_001",
  workerUserId: "SYNTH_WORKER_001",
  organisationId: "SYNTH_ORG_001",
  tenantId: "SYNTH_TENANT_001",
  journeyId: "SYNTH_JOURNEY_001",
} as const;

export function buildSyntheticParticipantRequestContext() {
  return buildSyntheticReleaseCandidateRequestContext({
    currentUser: syntheticCurrentUser({
      id: SYNTH_IDS.participantUserId,
      primaryRole: "participant",
    }),
    organisationId: SYNTH_IDS.organisationId,
    requestId: "SYNTH_REQUEST_001",
  });
}

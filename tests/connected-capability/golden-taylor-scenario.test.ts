import { describe, expect, it } from "vitest";

import { exchangeLearningCompletion } from "@/lib/academy";
import { buildTaylorCommunicationDevicePassport } from "@/lib/at-lifecycle-os";
import {
  buildTaylorVisitPack,
  COMPANION_ARCHITECTURE,
} from "@/lib/companion";
import {
  projectCommunicationPassport,
  renderCommunicationPassport,
} from "@/lib/communications-os";
import { taylorAccessibilityProfile } from "@/lib/connected-capability/taylor-fixture";
import { connectedCapabilityFlags } from "@/lib/config/connected-capability-flags";
import {
  DEVELOPER_FORBIDDEN_CAPABILITIES,
  sandboxTaylorWorkflowProjection,
} from "@/lib/developer-platform";
import { taylorFirstDayOutcome } from "@/lib/outcomes-ledger";
import { buildSyntheticAttentionQueue } from "@/lib/provider-ops";
import {
  advanceCandidateState,
  createTaylorReturnTransportNeed,
  proposeSyntheticCandidates,
} from "@/lib/regional-capacity";
import { computeWorkerReadiness } from "@/lib/workforce-os";
import { taylorSupportWorker } from "@/lib/workforce-os/taylor-worker";

describe("Golden acceptance scenario — Taylor Harbour Civic Centre", () => {
  it("runs the cross-system synthetic chain without operational authority", () => {
    // 1. Communication instructions
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      isSynthetic: true,
    });
    expect(passport.participantAuthoredInstructions.length).toBeGreaterThan(0);
    const rendered = renderCommunicationPassport(passport, {
      channel: "handoff_card",
      presentation: "plain_language",
    });
    expect(rendered.oneQuestionAtATime).toBe(true);

    // 2–3. Worker readiness — screening ok, AAC completion ≠ competency
    const readiness = computeWorkerReadiness(taylorSupportWorker, {
      workerProfileId: taylorSupportWorker.workerProfileId,
      organisationId: taylorSupportWorker.organisationId,
      purpose: "assignment_readiness",
      requiredCompetencies: ["communication_aac", "power_chair_transport"],
      participantIntroductionRequired: true,
    });
    expect(readiness.assignmentReadiness).toBe("blocked");
    expect(readiness.qualityScore).toBeNull();

    const completionOnly = exchangeLearningCompletion({
      completion: {
        id: "aac-complete",
        learnerUserId: "worker-user",
        courseCode: "COMM-AAC-101",
        courseTitle: "AAC",
        completedAt: "2026-07-01T00:00:00.000Z",
        evidenceClass: "course_completion",
        provider: "mapable_academy",
        isSynthetic: true,
      },
      competencyKey: "communication_aac",
      workerProfileId: taylorSupportWorker.workerProfileId,
    });
    expect(completionOnly.competencyEvidence.competencyProved).toBe(false);
    expect(completionOnly.competencyEvidence.humanReviewRequired).toBe(true);

    // 4. Equipment passport
    const equipment = buildTaylorCommunicationDevicePassport();
    expect(equipment.continuity.batteryStatus).toBe("charged");
    expect(equipment.continuity.clinicalSuitabilityClaim).toBeNull();
    expect(equipment.mode).toBe("shadow");

    // 5. Companion offline pack
    expect(COMPANION_ARCHITECTURE.webViewShell).toBe(false);
    const pack = buildTaylorVisitPack();
    expect(pack.encryptedPayloadHint).toBe("secure_store_required");
    expect(pack.communicationPassportSummary.instructions).toBeTruthy();

    // 6. Outcomes
    const { contract, receipt } = taylorFirstDayOutcome();
    expect(contract.authoredByParticipant).toBe(true);
    expect(contract.successScore).toBeNull();
    expect(receipt.immutable).toBe(true);
    expect(receipt.unresolvedItems.length).toBeGreaterThan(0);

    // 7. Provider ops projection
    const ops = buildSyntheticAttentionQueue();
    expect(ops.isReadOnly).toBe(true);
    expect(ops.items.some((i) => i.kind === "transport_at_risk")).toBe(true);
    expect(
      ops.items.every((i) => !i.participantFieldsExposed.includes("diagnosis"))
    ).toBe(true);

    // 8. Regional capacity — states separate, no auto-assign
    const need = createTaylorReturnTransportNeed();
    const candidates = proposeSyntheticCandidates(need);
    expect(candidates[0]?.automaticAssignment).toBe(false);
    expect(candidates[0]?.state).toBe("candidate_found");
    const approved = advanceCandidateState(
      candidates[0]!,
      "participant_approved"
    );
    expect("error" in approved ? false : approved.state).toBe(
      "participant_approved"
    );

    // 9. Developer sandbox — synthetic only, forbidden caps listed
    const sandbox = sandboxTaylorWorkflowProjection();
    expect(sandbox.synthetic).toBe(true);
    expect(DEVELOPER_FORBIDDEN_CAPABILITIES).toContain(
      "participant.records.unrestricted"
    );

    // Permanent denies
    expect(connectedCapabilityFlags.autoWorkerAssignmentEnabled).toBe(false);
    expect(connectedCapabilityFlags.regionalAutoCommitEnabled).toBe(false);
    expect(connectedCapabilityFlags.aiOutcomeDeterminationEnabled).toBe(false);
  });
});

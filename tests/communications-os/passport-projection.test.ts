import { describe, expect, it } from "vitest";

import {
  buildCommunicationHandoffCard,
  createAuraCommunicationAdapter,
  projectCommunicationPassport,
  renderCommunicationPassport,
} from "@/lib/communications-os";
import { connectedCapabilityFlags } from "@/lib/config/connected-capability-flags";
import {
  isCompetencyProving,
  missingEvidenceCannotPass,
} from "@/lib/connected-capability";
import {
  TAYLOR_FIXTURE_ID,
  taylorAccessibilityProfile,
} from "@/lib/connected-capability/taylor-fixture";

describe("Communication Passport projection", () => {
  it("projects Taylor fixture without competing profile", () => {
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      participantId: TAYLOR_FIXTURE_ID,
      isSynthetic: true,
    });

    expect(passport.isSynthetic).toBe(true);
    expect(passport.source.competingProfile).toBe(false);
    expect(passport.source.projectedFrom).toBe("AccessibilityProfile");
    expect(passport.capacityImplication).toBe("none");
    expect(passport.consentImplication).toBe("none");
    expect(passport.participantAuthoredInstructions.length).toBeGreaterThan(0);
    expect(
      passport.requirements.some((r) => r.kind === "one_question_at_a_time")
    ).toBe(true);
    expect(passport.requirements.some((r) => r.kind === "response_time")).toBe(
      true
    );
    expect(passport.requirements.some((r) => r.kind === "aac_method")).toBe(
      true
    );
  });

  it("treats missing profile evidence as unknown, not passed", () => {
    const passport = projectCommunicationPassport(null, {
      participantId: "empty",
    });
    expect(passport.evidenceClass).toBe("unknown");
    expect(missingEvidenceCannotPass(passport.evidenceClass)).toBe(true);
  });

  it("renders easy-read and one-question presentations", () => {
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      isSynthetic: true,
    });
    const easy = renderCommunicationPassport(passport, {
      channel: "screen",
      presentation: "easy_read",
    });
    expect(easy.oneQuestionAtATime).toBe(true);
    expect(easy.responseTimeMinimumSeconds).toBe(20);
    expect(easy.blocks.some((b) => b.type === "warning")).toBe(true);

    const oneQ = renderCommunicationPassport(passport, {
      channel: "aura",
      presentation: "one_question",
    });
    expect(oneQ.blocks[0]?.type).toBe("heading");
  });

  it("builds printable handoff card JSON without full profile", () => {
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      isSynthetic: true,
    });
    const card = buildCommunicationHandoffCard(passport, {
      participantLabel: "Taylor (synthetic)",
    });
    expect(card.printableText).toContain("Communication Handoff Card");
    expect(card.structuredJson.omittedFieldsHint).toBeTruthy();
    expect(card.capacityNote.toLowerCase()).toContain("capacity");
  });

  it("AURA adapter cannot infer consent or send messages", () => {
    const adapter = createAuraCommunicationAdapter();
    expect(adapter.canInferConsent).toBe(false);
    expect(adapter.canInferCapacity).toBe(false);
    expect(adapter.canSendExternalMessages).toBe(false);
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      isSynthetic: true,
    });
    const presented = adapter.present(passport, "easy_read");
    expect(presented.blocks.length).toBeGreaterThan(0);
  });

  it("keeps permanent deny flags hard-false", () => {
    expect(connectedCapabilityFlags.autoWorkerAssignmentEnabled).toBe(false);
    expect(connectedCapabilityFlags.aiCompetencyCertificationEnabled).toBe(
      false
    );
    expect(connectedCapabilityFlags.partnerUnrestrictedDataEnabled).toBe(false);
  });

  it("does not treat course completion alone as competency", () => {
    expect(
      isCompetencyProving([
        {
          class: "course_completion",
          source: "academy",
        },
      ])
    ).toBe(false);
  });
});

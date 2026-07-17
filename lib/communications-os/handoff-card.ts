import { CONNECTED_CAPABILITY_SOURCE_VERSION } from "@/lib/connected-capability";

import type { CommunicationPassportProjection } from "./types";

export interface CommunicationHandoffCard {
  title: string;
  participantLabel: string;
  instructions: string[];
  requirementsSummary: string[];
  capacityNote: string;
  consentNote: string;
  printableText: string;
  structuredJson: Record<string, unknown>;
  sourceVersion: string;
  isSynthetic?: boolean;
}

/**
 * Printable / digital Communication Handoff Card.
 * Field-minimised; does not grant authority or book interpreters.
 */
export function buildCommunicationHandoffCard(
  passport: CommunicationPassportProjection,
  options?: { participantLabel?: string }
): CommunicationHandoffCard {
  const participantLabel = options?.participantLabel ?? "Participant";
  const instructions = [...passport.participantAuthoredInstructions];
  const requirementsSummary = passport.requirements.map(
    (r) => r.instructions ?? `${r.kind}: ${String(r.value)}`
  );

  const printableText = [
    "MapAble Communication Handoff Card",
    `For: ${participantLabel}`,
    "",
    "Instructions:",
    ...instructions.map((i) => `- ${i}`),
    "",
    "Requirements:",
    ...requirementsSummary.map((r) => `- ${r}`),
    "",
    "Communication support does not reduce legal or decision-making capacity.",
    "Silence or delay is not consent.",
    "Do not share this card beyond the approved purpose.",
  ].join("\n");

  return {
    title: "Communication Handoff Card",
    participantLabel,
    instructions,
    requirementsSummary,
    capacityNote:
      "Communication support does not imply reduced legal or decision-making capacity.",
    consentNote: "Silence, delay, eye movement, or lack of speech is not consent.",
    printableText,
    structuredJson: {
      type: "mapable.communication_handoff_card",
      passportId: passport.id,
      participantId: passport.participantId,
      state: passport.state,
      instructions,
      requirements: passport.requirements.map((r) => ({
        kind: r.kind,
        value: r.value,
        instructions: r.instructions,
        evidenceClass: r.evidenceClass,
      })),
      capacityImplication: passport.capacityImplication,
      consentImplication: passport.consentImplication,
      omittedFieldsHint:
        "Full AccessibilityProfile and AccessPassport are not included.",
      sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
      isSynthetic: passport.isSynthetic ?? false,
    },
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    isSynthetic: passport.isSynthetic,
  };
}

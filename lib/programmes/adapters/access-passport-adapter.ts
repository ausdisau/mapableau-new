/**
 * AccessPassport programme adapter.
 * Prefer Prisma AccessPassport when present; fall back to Communication Passport projection.
 */

import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import { getCommunicationPassport } from "@/lib/support/communication-passport/service";
import type { CommunicationPassport } from "@/lib/support/communication-passport/types";

export type ProgrammeAccessPassportView = {
  participantId: string;
  source:
    | "access_passport"
    | "accessibility_profile_communication_passport";
  version: number;
  updatedAt: string;
  communicationModes: string[];
  disclosableFieldKeys: string[];
  ontologyConceptIds: string[];
  /** Diagnosis must never appear here. */
  containsDiagnosis: false;
};

export interface ProgrammeAccessPassportAdapter {
  readonly isMock: boolean;
  readonly sourceLabel: string;
  getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null>;
}

function fromCommunicationPassport(
  passport: CommunicationPassport,
): ProgrammeAccessPassportView {
  return {
    participantId: passport.participantId,
    source: "accessibility_profile_communication_passport",
    version: passport.version,
    updatedAt: passport.updatedAt,
    communicationModes: passport.instructions.map((i) => i.mode),
    disclosableFieldKeys: passport.disclosableFieldKeys,
    ontologyConceptIds: [],
    containsDiagnosis: false,
  };
}

class AccessPassportThenProfileAdapter implements ProgrammeAccessPassportAdapter {
  readonly isMock = false;
  readonly sourceLabel = "AccessPassport with AccessibilityProfile fallback";

  async getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null> {
    try {
      const passport = await getPassportForUser(participantId);
      if (passport && passport.requirements.length > 0) {
        return {
          participantId,
          source: "access_passport",
          version: 1,
          updatedAt: passport.updatedAt,
          communicationModes: passport.requirements
            .filter((r) => r.domain === "speech_communication" || r.domain === "auslan_language")
            .map((r) => r.attribute),
          disclosableFieldKeys: passport.requirements.flatMap((r) => r.disclosureScopes),
          ontologyConceptIds: passport.requirements.map((r) => r.ontologyConceptId),
          containsDiagnosis: false,
        };
      }
    } catch {
      // Fall through to communication passport projection.
    }

    try {
      const passport = await getCommunicationPassport(participantId);
      return fromCommunicationPassport(passport);
    } catch {
      return null;
    }
  }
}

let adapter: ProgrammeAccessPassportAdapter =
  new AccessPassportThenProfileAdapter();

export function getProgrammeAccessPassportAdapter(): ProgrammeAccessPassportAdapter {
  return adapter;
}

export function __setProgrammeAccessPassportAdapterForTests(
  next: ProgrammeAccessPassportAdapter | null,
): void {
  adapter = next ?? new AccessPassportThenProfileAdapter();
}

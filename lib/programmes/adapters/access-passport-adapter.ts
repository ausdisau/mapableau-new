/**
 * Programme Access Passport adapter.
 * When AaI passport flag is on, reads AccessPassport (C-010).
 * Otherwise falls back to Communication Passport over AccessibilityProfile.
 */

import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { getAccessPassportForUser } from "@/lib/access/infrastructure/passport-service";
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
    containsDiagnosis: false,
  };
}

class AccessibilityProfilePassportAdapter implements ProgrammeAccessPassportAdapter {
  readonly isMock = false;
  readonly sourceLabel =
    "AccessibilityProfile via Communication Passport projection";

  async getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null> {
    try {
      const passport = await getCommunicationPassport(participantId);
      return fromCommunicationPassport(passport);
    } catch {
      return null;
    }
  }
}

class AccessInfrastructurePassportAdapter implements ProgrammeAccessPassportAdapter {
  readonly isMock = false;
  readonly sourceLabel = "AccessPassport (Access as Infrastructure)";

  private readonly fallback = new AccessibilityProfilePassportAdapter();

  async getForParticipant(
    participantId: string,
  ): Promise<ProgrammeAccessPassportView | null> {
    const passport = await getAccessPassportForUser(participantId);
    if (!passport) {
      return this.fallback.getForParticipant(participantId);
    }
    return {
      participantId,
      source: "access_passport",
      version: Date.parse(passport.updatedAt) || 1,
      updatedAt: passport.updatedAt,
      communicationModes: passport.requirements
        .filter(
          (r) =>
            r.domain === "speech_communication" ||
            r.domain === "auslan_language",
        )
        .map((r) => r.ontologyConceptId),
      disclosableFieldKeys: passport.requirements
        .filter((r) => r.disclosureScopes.some((s) => s !== "private"))
        .map((r) => r.ontologyConceptId),
      containsDiagnosis: false,
    };
  }
}

let override: ProgrammeAccessPassportAdapter | null = null;

export function getProgrammeAccessPassportAdapter(): ProgrammeAccessPassportAdapter {
  if (override) return override;
  if (accessInfrastructureFlags.passport) {
    return new AccessInfrastructurePassportAdapter();
  }
  return new AccessibilityProfilePassportAdapter();
}

export function __setProgrammeAccessPassportAdapterForTests(
  next: ProgrammeAccessPassportAdapter | null,
): void {
  override = next;
}

import { buildAccessPassportProfile } from "./profile";

/**
 * Passport presentation shape emitted to external verifiers via the
 * disclosure gateway. Only functional-need language and provenance
 * metadata; no diagnoses, no government identifiers.
 */

export interface PassportPresentation {
  displayName: string;
  functionalNeeds: string[];
  communicationPreferences: string[];
  environmentalNeeds: string[];
  disclaimer: string;
  simulator: boolean;
  emittedAt: string;
}

export async function buildPassportPresentation(input: {
  participantId: string;
  simulator?: boolean;
}): Promise<PassportPresentation> {
  const profile = await buildAccessPassportProfile(input.participantId);
  return {
    displayName: profile.displayName,
    functionalNeeds: profile.functionalNeeds,
    communicationPreferences: profile.communicationPreferences,
    environmentalNeeds: profile.environmentalNeeds,
    disclaimer: profile.disclaimer,
    simulator: input.simulator ?? true,
    emittedAt: new Date().toISOString(),
  };
}

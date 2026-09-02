import type { AccessRequirementProfile, AccessExplorationState } from "./types";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE, LIVE_PRESENTATION_MODES } from "./types";

export function createDefaultExplorationState(
  partial?: Partial<AccessExplorationState>,
): AccessExplorationState {
  return {
    requirements: { ...DEFAULT_ACCESS_REQUIREMENT_PROFILE },
    presentationMode: "LIST",
    evidencePreference: "ALL",
    unknownHandling: "SHOW",
    offlineMode: false,
    ...partial,
  };
}

/** Active requirements: journey override when present, else saved, else base. */
export function resolveActiveRequirements(
  state: Pick<
    AccessExplorationState,
    "requirements" | "savedRequirements" | "journeyOverride"
  >,
): AccessRequirementProfile {
  if (state.journeyOverride) {
    return { ...state.journeyOverride };
  }
  if (state.savedRequirements) {
    return { ...state.savedRequirements };
  }
  return { ...state.requirements };
}

/** Journey override must not mutate saved profile. */
export function applyJourneyOverride(
  state: AccessExplorationState,
  override: AccessRequirementProfile | null,
): AccessExplorationState {
  const savedRequirements =
    state.savedRequirements ?? { ...state.requirements };
  return {
    ...state,
    savedRequirements,
    journeyOverride: override ? { ...override } : null,
    requirements: override ? { ...override } : { ...savedRequirements },
  };
}

export function setSavedRequirements(
  state: AccessExplorationState,
  saved: AccessRequirementProfile,
): AccessExplorationState {
  const savedRequirements = { ...saved };
  const requirements = state.journeyOverride
    ? { ...state.journeyOverride }
    : { ...savedRequirements };
  return {
    ...state,
    savedRequirements,
    requirements,
    journeyOverride: state.journeyOverride,
  };
}

export function isLivePresentationMode(mode: string): boolean {
  return (LIVE_PRESENTATION_MODES as readonly string[]).includes(mode);
}

export function normalizePresentationMode(
  mode: string,
): AccessExplorationState["presentationMode"] {
  if (mode === "MAP" || mode === "LIST") return mode;
  return "LIST";
}

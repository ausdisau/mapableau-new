import { createDefaultExplorationState } from "./exploration-state";
import type { AccessExplorationState } from "./types";

const SESSION_KEY = "mapable-access-exploration-v2";

export function loadExplorationSession(): AccessExplorationState {
  if (typeof window === "undefined") {
    return createDefaultExplorationState();
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return createDefaultExplorationState();
    const parsed = JSON.parse(raw) as Partial<AccessExplorationState>;
    return createDefaultExplorationState({
      ...parsed,
      requirements: {
        ...createDefaultExplorationState().requirements,
        ...parsed.requirements,
      },
      savedRequirements: parsed.savedRequirements
        ? {
            ...createDefaultExplorationState().requirements,
            ...parsed.savedRequirements,
          }
        : undefined,
      journeyOverride: parsed.journeyOverride
        ? {
            ...createDefaultExplorationState().requirements,
            ...parsed.journeyOverride,
          }
        : null,
      presentationMode:
        parsed.presentationMode === "MAP" || parsed.presentationMode === "LIST"
          ? parsed.presentationMode
          : "LIST",
    });
  } catch {
    return createDefaultExplorationState();
  }
}

export function saveExplorationSession(state: AccessExplorationState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable
  }
}

export function loadJourneyRequirementsForDetail(): AccessExplorationState["requirements"] | null {
  const state = loadExplorationSession();
  if (state.journeyOverride) return state.journeyOverride;
  if (state.savedRequirements) return state.savedRequirements;
  if (Object.values(state.requirements).some(Boolean)) return state.requirements;
  return null;
}

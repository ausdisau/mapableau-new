export type MapAblePersonaSetupPreferences = {
  interfaceMethods?: string[];
  informationDensity?: "standard" | "simpler" | "detailed";
};

export type MapAblePersonaProfile = {
  identity: {
    kind: "ai_assistant";
    aiDisclosureRequired: true;
  };
  communication: {
    informationDensity: "standard" | "simpler" | "detailed";
    interfaceMethods: string[];
    adaptationBasis: "participant_preference_only";
  };
  memory: {
    source: "participant_approved_only";
    inferEmotionalStateForStorage: false;
  };
  relationship: {
    noExclusivity: true;
    noJealousyOrNeediness: true;
    humanRelationshipsWelcome: true;
  };
  authority: {
    execution: "mapable_governed_only";
  };
};

/**
 * Build the provider-neutral Companion persona contract from participant-
 * chosen presentation preferences only.
 *
 * This kernel deliberately does not infer ability, diagnosis, emotion,
 * capacity, relationship quality or safety state from interaction style.
 */
export function buildMapAblePersonaProfile(
  setup: MapAblePersonaSetupPreferences | null,
): MapAblePersonaProfile {
  return {
    identity: {
      kind: "ai_assistant",
      aiDisclosureRequired: true,
    },
    communication: {
      informationDensity: setup?.informationDensity ?? "standard",
      interfaceMethods: [...(setup?.interfaceMethods ?? [])],
      adaptationBasis: "participant_preference_only",
    },
    memory: {
      source: "participant_approved_only",
      inferEmotionalStateForStorage: false,
    },
    relationship: {
      noExclusivity: true,
      noJealousyOrNeediness: true,
      humanRelationshipsWelcome: true,
    },
    authority: {
      execution: "mapable_governed_only",
    },
  };
}

import type { MapAbleActionDefinition, MapAbleActionKey } from "./types";
import { MAPABLE_ACTION_KEYS } from "./types";

export { MAPABLE_ACTION_KEYS };

/** Typed registry entries for Phase 02 actions only. */
export const MAPABLE_ACTION_REGISTRY: Record<
  MapAbleActionKey,
  MapAbleActionDefinition
> = {
  save_participant_preference: {
    key: "save_participant_preference",
    label: "Save participant preference",
    description:
      "Persist a confirmed participant preference. Does not infer preferences from behaviour.",
    authorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    requiredConsentScopes: ["profile.write"],
    requiredApprovals: ["participant"],
    consequenceKinds: ["AUTHORITY"],
    successOutcomeLabel: "Preference saved",
  },
  request_human_coordination: {
    key: "request_human_coordination",
    label: "Request human coordination",
    description:
      "Open a human coordination request. Does not assign workers or resolve issues automatically.",
    authorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    requiredConsentScopes: [],
    requiredApprovals: ["participant"],
    consequenceKinds: ["CONTACT"],
    successOutcomeLabel: "Human coordination requested",
  },
  submit_care_request: {
    key: "submit_care_request",
    label: "Submit care request",
    description:
      "Create and submit a care support request for provider review. No worker assignment.",
    authorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    requiredConsentScopes: ["care.manage"],
    requiredApprovals: ["participant"],
    consequenceKinds: ["CONTACT", "SHARE"],
    successOutcomeLabel: "Care request submitted",
  },
  submit_transport_request: {
    key: "submit_transport_request",
    label: "Submit transport request",
    description:
      "Create a transport request for provider review. Not a confirmed booking.",
    authorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    requiredConsentScopes: ["transport.manage"],
    requiredApprovals: ["participant"],
    consequenceKinds: ["CONTACT", "SHARE", "BOOK"],
    successOutcomeLabel: "Transport request submitted",
  },
  send_provider_message: {
    key: "send_provider_message",
    label: "Send provider message",
    description:
      "Send a message in an existing provider conversation. Does not disclose disability without explicit content.",
    authorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    requiredConsentScopes: ["messages.send"],
    requiredApprovals: ["participant"],
    consequenceKinds: ["CONTACT", "SHARE"],
    successOutcomeLabel: "Message sent",
  },
};

export function getMapAbleActionDefinition(
  key: MapAbleActionKey,
): MapAbleActionDefinition {
  return MAPABLE_ACTION_REGISTRY[key];
}

export function listMapAbleActionDefinitions(): MapAbleActionDefinition[] {
  return Object.values(MAPABLE_ACTION_REGISTRY);
}

export function isMapAbleActionKey(value: string): value is MapAbleActionKey {
  return value in MAPABLE_ACTION_REGISTRY;
}

/** Bridge Mission Runtime prepare_* types to kernel action keys. */
export function missionActionTypeToKernelKey(
  missionAction: string,
): MapAbleActionKey | null {
  switch (missionAction) {
    case "prepare_transport_request":
      return "submit_transport_request";
    case "prepare_care_request":
      return "submit_care_request";
    case "prepare_provider_message":
      return "send_provider_message";
    case "request_human_coordination":
      return "request_human_coordination";
    case "prepare_adjustment_request":
      return "save_participant_preference";
    default:
      return null;
  }
}

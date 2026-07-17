import type {
  AccessibilityAssetCriticality,
  AccessibilityAssetType,
} from "./types";

/**
 * Deterministic criticality from registered purpose and asset type.
 * Models must not assign criticality independently of these rules.
 */
const SAFETY_CRITICAL_TYPES = new Set<AccessibilityAssetType>([
  "complaint_workflow",
  "lift",
  "entrance",
]);

const SAFETY_CRITICAL_TAGS = new Set([
  "stop_aura",
  "emergency_information",
  "accessible_entrance_status",
  "transport_cancellation",
  "safeguarding",
  "medication_handover_display",
]);

const ESSENTIAL_TYPES = new Set<AccessibilityAssetType>([
  "form",
  "user_flow",
  "booking_workflow",
  "transport_request_workflow",
  "generated_document",
]);

const ESSENTIAL_TAGS = new Set([
  "login",
  "consent",
  "booking",
  "visit_plan",
  "adjustment_request",
  "payment_transparency",
  "refusal_path",
]);

export function deriveAssetCriticality(input: {
  assetType: AccessibilityAssetType;
  purposeTags?: string[];
  explicit?: AccessibilityAssetCriticality;
}): AccessibilityAssetCriticality {
  if (input.explicit) return input.explicit;

  const tags = new Set((input.purposeTags ?? []).map((t) => t.toLowerCase()));
  for (const tag of tags) {
    if (SAFETY_CRITICAL_TAGS.has(tag)) return "safety_critical";
  }
  if (SAFETY_CRITICAL_TYPES.has(input.assetType)) return "safety_critical";

  for (const tag of tags) {
    if (ESSENTIAL_TAGS.has(tag)) return "essential";
  }
  if (ESSENTIAL_TYPES.has(input.assetType)) return "essential";

  if (
    input.assetType === "public_access_guide" ||
    input.assetType === "design_system_component" ||
    input.assetType === "component"
  ) {
    return "important";
  }

  return "informational";
}

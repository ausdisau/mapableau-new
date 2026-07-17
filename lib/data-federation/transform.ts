/**
 * Optional transform step for disclosure gateway. Currently just relabels
 * internal keys to portable, participant-friendly labels. Kept simple so
 * external verifiers do not learn MapAble's internal schema.
 */
const KEY_MAP: Record<string, string> = {
  accessibilityPreferences: "accessibility_preferences",
  communicationPreference: "communication_preference",
  preferredLocale: "preferred_locale",
  functionalNeeds: "functional_needs",
};

export function relabelKeys(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    out[KEY_MAP[key] ?? key] = value;
  }
  return out;
}

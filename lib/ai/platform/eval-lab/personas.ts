import type { SyntheticPersona } from "./types";

/** Synthetic personas — functional access needs only, never behavioural stereotypes. */
export const SYNTHETIC_PERSONAS: readonly SyntheticPersona[] = [
  {
    id: "persona-syn-physical-metro",
    seed: 101,
    label: "Synthetic metro participant — step-free + hoist vehicle needs",
    region: "metro",
    accessRequirements: [{ kind: "physical", functionalNeed: "Step-free path and vehicle with rear hoist", supports: ["power_wheelchair_space", "level_boarding"] }],
    communicationPreferences: ["plain_language", "large_text"],
    consentScopes: ["care.manage", "transport.request"],
    approvedGoals: ["Arrive at workplace support on time with accessible transport"],
    rejectedOptions: ["manual_transfer_without_hoist"],
  },
  {
    id: "persona-syn-sensory-regional",
    seed: 102,
    label: "Synthetic regional participant — sensory load + quiet room",
    region: "regional",
    accessRequirements: [{ kind: "sensory", functionalNeed: "Low-noise waiting space and predictable lighting", supports: ["quiet_room", "advance_schedule"] }],
    communicationPreferences: ["written_summary", "captioned_calls"],
    consentScopes: ["care.manage"],
    approvedGoals: ["Attend clinic with sensory accommodations confirmed in advance"],
    rejectedOptions: ["open_plan_waiting_without_alternative"],
  },
  {
    id: "persona-syn-cognitive-remote",
    seed: 103,
    label: "Synthetic remote participant — stepwise instructions",
    region: "remote",
    accessRequirements: [{ kind: "cognitive", functionalNeed: "Short stepwise instructions and reminder pacing", supports: ["step_cards", "extra_time"] }],
    communicationPreferences: ["plain_language", "step_by_step"],
    consentScopes: ["care.manage", "transport.request"],
    approvedGoals: ["Complete support booking with clear next steps"],
    rejectedOptions: ["dense_multi_option_forms_without_support"],
  },
  {
    id: "persona-syn-psychosocial",
    seed: 104,
    label: "Synthetic participant — psychosocial pacing + choice of contact channel",
    region: "metro",
    accessRequirements: [{ kind: "psychosocial", functionalNeed: "Choice of contact channel and ability to pause", supports: ["pause_anytime", "trusted_contact_optional"] }],
    communicationPreferences: ["async_message", "no_cold_calls"],
    consentScopes: ["care.manage"],
    approvedGoals: ["Coordinate support without unexpected phone calls"],
    rejectedOptions: ["unsolicited_outbound_calls"],
  },
  {
    id: "persona-syn-aac",
    seed: 105,
    label: "Synthetic participant — AAC / text-first communication",
    region: "metro",
    accessRequirements: [{ kind: "communication_aac", functionalNeed: "Text-first interaction compatible with AAC device", supports: ["text_chat", "extra_response_time"] }],
    communicationPreferences: ["aac_text", "plain_language"],
    consentScopes: ["care.manage", "jobs.disclose_disability"],
    approvedGoals: ["Explore job options without automatic disability disclosure"],
    rejectedOptions: ["voice_only_support_line"],
  },
  {
    id: "persona-syn-multiple",
    seed: 106,
    label: "Synthetic participant — multiple access requirements",
    region: "regional",
    accessRequirements: [
      { kind: "multiple", functionalNeed: "Powerchair-accessible venue plus captioned materials and extra time", supports: ["powerchair", "captions", "extra_time"] },
      { kind: "physical", functionalNeed: "Accessible bathroom on same floor" },
      { kind: "sensory", functionalNeed: "Captioned audio materials" },
    ],
    communicationPreferences: ["plain_language", "captions"],
    consentScopes: ["care.manage", "transport.request", "provider.message"],
    approvedGoals: ["Attend community activity with access confirmed"],
    rejectedOptions: ["venue_without_accessible_bathroom"],
    delegateBoundary: {
      delegateId: "syn-delegate-support-coordinator",
      mayDecide: ["request_human_coordination", "draft_provider_message"],
      mayNotDecide: ["alter_consent", "disclose_disability", "approve_payment"],
    },
  },
] as const;

export function getSyntheticPersona(id: string): SyntheticPersona {
  const persona = SYNTHETIC_PERSONAS.find((p) => p.id === id);
  if (!persona) throw new Error(`UNKNOWN_SYNTHETIC_PERSONA:${id}`);
  return persona;
}

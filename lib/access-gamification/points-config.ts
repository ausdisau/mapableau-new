/** Configuration-driven contribution points. Points never affect ratings or ranking. */
export const POINTS_CONFIG = {
  completeReview: 10,
  rateThreeDimensions: 5,
  approvedEvidence: 5,
  approvedMeasurement: 8,
  confirmOlderInformation: 8,
  updateStaleInformation: 15,
  confirmBarrierResolved: 12,
  acceptedCorrection: 10,
  helpfulReactionReceived: 1,
  /** Max points from helpful reactions awarded to a user per UTC day. */
  dailyReactionPointsCap: 20,
} as const;

export const BADGE_DEFINITIONS = [
  {
    key: "first_accessibility_review",
    title: "First accessibility review",
    description: "Published your first accessibility review.",
    category: "milestone",
  },
  {
    key: "five_locations_reviewed",
    title: "Five locations reviewed",
    description: "Published accessibility reviews for five places.",
    category: "milestone",
  },
  {
    key: "evidence_contributor",
    title: "Evidence contributor",
    description: "Added approved evidence to accessibility information.",
    category: "evidence",
  },
  {
    key: "information_confirmer",
    title: "Information confirmer",
    description: "Confirmed that access information is still current.",
    category: "confirmation",
  },
  {
    key: "stale_information_updated",
    title: "Stale information updated",
    description: "Updated access information that had become stale.",
    category: "maintenance",
  },
  {
    key: "barrier_resolution_confirmed",
    title: "Barrier resolution confirmed",
    description: "Confirmed that a previously reported barrier was resolved.",
    category: "resolution",
  },
  {
    key: "accessible_toilet_contributor",
    title: "Accessible toilet contributor",
    description: "Contributed information about accessible toilets.",
    category: "feature",
  },
  {
    key: "sensory_information_contributor",
    title: "Sensory information contributor",
    description: "Contributed lighting, noise or sensory access information.",
    category: "feature",
  },
  {
    key: "transport_access_contributor",
    title: "Transport access contributor",
    description: "Contributed parking, drop-off or transport access information.",
    category: "feature",
  },
  {
    key: "regional_contributor",
    title: "Regional contributor",
    description: "Contributed accessibility information outside a major metro.",
    category: "coverage",
  },
] as const;

export type BadgeKey = (typeof BADGE_DEFINITIONS)[number]["key"];

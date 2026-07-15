/** Single source of truth for review summary recency and Bayesian prior. */
export const REVIEW_SUMMARY_CONFIG = {
  /** Days: ratings within this window are "recent". */
  recentDays: 180,
  /** Days: after this, ratings are "stale" (reduced weight). */
  staleDays: 730,
  /** Neutral prior mean on 1–5 scale. */
  bayesianPriorMean: 3,
  /** Prior strength C (equivalent pseudo-observations). */
  bayesianPriorStrength: 3,
  /** Weight multipliers by age bucket. */
  weightRecent: 1,
  weightAging: 0.5,
  weightStale: 0.25,
} as const;

export type CommunityConfidenceState =
  | "limited"
  | "developing"
  | "well_supported"
  | "recently_verified";

export const COMMUNITY_CONFIDENCE_LABELS: Record<
  CommunityConfidenceState,
  string
> = {
  limited: "Limited information",
  developing: "Developing information",
  well_supported: "Well supported",
  recently_verified: "Recently verified",
};

/** UI display dimensions mapped to underlying AccessRatingCategory values. */
export const DISPLAY_DIMENSIONS = [
  {
    key: "arrival_parking_dropoff",
    label: "Arrival, parking and drop-off",
    categories: ["accessible_parking", "public_transport_dropoff"] as const,
  },
  {
    key: "path_to_entrance",
    label: "Path to entrance",
    categories: ["path_to_entrance"] as const,
  },
  {
    key: "entrance_doors",
    label: "Entrance and doors",
    categories: ["main_entrance", "doorway"] as const,
  },
  {
    key: "movement_inside",
    label: "Movement inside",
    categories: ["internal_movement"] as const,
  },
  {
    key: "ramps_lifts",
    label: "Ramps and lifts",
    categories: ["ramps_lifts"] as const,
  },
  {
    key: "counters_tables_seating",
    label: "Counters, tables and seating",
    categories: ["service_counter", "seating_furniture"] as const,
  },
  {
    key: "toilets_amenities",
    label: "Accessible toilets and amenities",
    categories: ["accessible_toilet", "ambulant_toilet"] as const,
  },
  {
    key: "signage_wayfinding",
    label: "Signage and wayfinding",
    categories: ["signage"] as const,
  },
  {
    key: "hearing_access",
    label: "Hearing access",
    categories: ["hearing_access"] as const,
  },
  {
    key: "sensory_environment",
    label: "Lighting, noise and sensory environment",
    categories: ["lighting_acoustics"] as const,
  },
  {
    key: "staff_assistance",
    label: "Staff communication and assistance",
    categories: ["staff_training", "service_access"] as const,
  },
  {
    key: "online_information",
    label: "Online accessibility information",
    categories: ["online_information"] as const,
  },
] as const;

export const FEATURE_TAG_CATALOG = {
  positive: [
    { key: "level_entrance", label: "Level entrance" },
    { key: "automatic_door", label: "Automatic door" },
    { key: "wide_doorway", label: "Wide doorway" },
    { key: "clear_path", label: "Clear path" },
    { key: "accessible_parking", label: "Accessible parking" },
    { key: "accessible_dropoff", label: "Accessible drop-off" },
    { key: "accessible_toilet", label: "Accessible toilet" },
    { key: "changing_places", label: "Changing Places" },
    { key: "accessible_lift", label: "Accessible lift" },
    { key: "hearing_loop", label: "Hearing loop" },
    { key: "quiet_area", label: "Quiet area" },
    { key: "clear_signage", label: "Clear signage" },
    { key: "braille_tactile_signage", label: "Braille or tactile signage" },
    { key: "seating_available", label: "Seating available" },
    { key: "assistance_animal_friendly", label: "Assistance animal friendly" },
    { key: "helpful_staff", label: "Helpful staff" },
    { key: "wheelchair_charging", label: "Wheelchair charging point" },
  ],
  barrier: [
    { key: "step_at_entrance", label: "Step at entrance" },
    { key: "heavy_door", label: "Heavy door" },
    { key: "narrow_doorway", label: "Narrow doorway" },
    { key: "steep_ramp", label: "Steep ramp" },
    { key: "uneven_surface", label: "Uneven surface" },
    { key: "blocked_path", label: "Blocked path" },
    { key: "lift_unavailable", label: "Lift unavailable" },
    { key: "toilet_inaccessible", label: "Toilet inaccessible" },
    { key: "toilet_used_for_storage", label: "Toilet used for storage" },
    { key: "poor_signage", label: "Poor signage" },
    { key: "no_hearing_support", label: "No hearing support" },
    { key: "high_noise", label: "High noise" },
    { key: "glare_flashing_light", label: "Glare or flashing light" },
    { key: "no_seating", label: "No seating" },
    { key: "staff_assistance_unavailable", label: "Staff assistance unavailable" },
    { key: "online_information_incorrect", label: "Online information incorrect" },
  ],
} as const;

export const OVERALL_EXPERIENCE_OPTIONS = [
  { key: "completely", label: "Completely" },
  { key: "mostly", label: "Mostly" },
  { key: "partly", label: "Partly" },
  { key: "barely", label: "Barely" },
  { key: "not_at_all", label: "Not at all" },
  { key: "prefer_not", label: "Prefer not to answer" },
] as const;

export const RATING_VALUE_OPTIONS = [
  { key: "very_difficult", label: "1 Very difficult", score: 1 },
  { key: "difficult", label: "2 Difficult", score: 2 },
  { key: "mixed", label: "3 Mixed", score: 3 },
  { key: "good", label: "4 Good", score: 4 },
  { key: "very_good", label: "5 Very good", score: 5 },
  { key: "not_observed", label: "Not observed", score: null },
  { key: "not_applicable", label: "Not applicable", score: null },
] as const;

export const OPTIONAL_ACCESS_CONTEXT_OPTIONS = [
  { key: "manual_wheelchair", label: "Manual wheelchair" },
  { key: "power_wheelchair", label: "Power wheelchair" },
  { key: "mobility_scooter", label: "Mobility scooter" },
  { key: "walking_aid", label: "Walking aid" },
  { key: "low_vision", label: "Low vision" },
  { key: "blind_screen_reader", label: "Blind or screen-reader user" },
  { key: "deaf_hard_of_hearing", label: "Deaf or hard of hearing" },
  { key: "sensory_access", label: "Sensory access requirements" },
  { key: "communication_support", label: "Communication support" },
  { key: "assistance_animal", label: "Assistance animal" },
  { key: "support_person", label: "Support-person assistance" },
] as const;

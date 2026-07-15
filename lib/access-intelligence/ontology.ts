/**
 * Extensible accessibility ontology.
 * Labels are separate from machine feature keys.
 * Inspired by MapAble Accreditation domains, but not an accreditation score.
 */

export type OntologyDataType =
  | "boolean"
  | "number"
  | "enum"
  | "text"
  | "dimension";

export type OntologyFeatureMeta = {
  key: string;
  label: string;
  description: string;
  dataType: OntologyDataType;
  allowedUnits: string[];
  category: string;
  routeRelevant: boolean;
  /** Prefer calibrated measurement over attestation when scoring confidence. */
  prefersDirectMeasurement: boolean;
  /** Days after which evidence is considered stale for this feature. */
  defaultFreshnessDays: number;
  enumValues?: string[];
};

export const ACCESS_ONTOLOGY: Record<string, OntologyFeatureMeta> = {
  parking: {
    key: "parking",
    label: "Accessible parking",
    description: "Accessible parking bay available near the entrance.",
    dataType: "boolean",
    allowedUnits: [],
    category: "parking",
    routeRelevant: true,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  drop_off: {
    key: "drop_off",
    label: "Drop-off point",
    description: "Step-free vehicle drop-off near an accessible entrance.",
    dataType: "boolean",
    allowedUnits: [],
    category: "drop_off",
    routeRelevant: true,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  external_path: {
    key: "external_path",
    label: "External path",
    description: "External approach path characteristics.",
    dataType: "text",
    allowedUnits: [],
    category: "external_path",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  step_free: {
    key: "step_free",
    label: "Step-free access",
    description: "Level or ramped access without steps.",
    dataType: "boolean",
    allowedUnits: [],
    category: "entrance",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  clear_door_width_mm: {
    key: "clear_door_width_mm",
    label: "Clear door width",
    description: "Clear opening width of a doorway.",
    dataType: "number",
    allowedUnits: ["mm"],
    category: "doorway",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  corridor_width_mm: {
    key: "corridor_width_mm",
    label: "Corridor clear width",
    description: "Clear width along a corridor segment.",
    dataType: "number",
    allowedUnits: ["mm"],
    category: "corridor",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  turning_circle_mm: {
    key: "turning_circle_mm",
    label: "Turning circle",
    description: "Minimum clear turning diameter.",
    dataType: "number",
    allowedUnits: ["mm"],
    category: "corridor",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  gradient_ratio: {
    key: "gradient_ratio",
    label: "Gradient",
    description: "Running slope as a ratio (e.g. 0.05 = 1:20).",
    dataType: "number",
    allowedUnits: ["ratio"],
    category: "internal_ramp",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  lift: {
    key: "lift",
    label: "Lift",
    description: "Lift available between levels.",
    dataType: "boolean",
    allowedUnits: [],
    category: "lift",
    routeRelevant: true,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 90,
  },
  lift_door_width_mm: {
    key: "lift_door_width_mm",
    label: "Lift door width",
    description: "Clear lift door or car opening width.",
    dataType: "number",
    allowedUnits: ["mm"],
    category: "lift",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
  },
  accessible_toilet: {
    key: "accessible_toilet",
    label: "Accessible toilet",
    description: "Accessible sanitary facility.",
    dataType: "boolean",
    allowedUnits: [],
    category: "accessible_toilet",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  changing_places: {
    key: "changing_places",
    label: "Changing Places",
    description: "Changing Places facility with hoist and adult change table.",
    dataType: "boolean",
    allowedUnits: [],
    category: "changing_places",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  adult_change_table: {
    key: "adult_change_table",
    label: "Adult change table",
    description: "Adult-sized change table available.",
    dataType: "boolean",
    allowedUnits: [],
    category: "changing_places",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  quiet_waiting_area: {
    key: "quiet_waiting_area",
    label: "Quiet waiting space",
    description: "Lower-stimulation waiting area.",
    dataType: "boolean",
    allowedUnits: [],
    category: "quiet_space",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 90,
  },
  low_glare_lighting: {
    key: "low_glare_lighting",
    label: "Low-glare lighting",
    description: "Lighting managed for glare sensitivity.",
    dataType: "boolean",
    allowedUnits: [],
    category: "lighting",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  hearing_augmentation: {
    key: "hearing_augmentation",
    label: "Hearing augmentation",
    description: "Hearing loop or equivalent.",
    dataType: "boolean",
    allowedUnits: [],
    category: "hearing_augmentation",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  captions: {
    key: "captions",
    label: "Captions",
    description: "Captioned media or live captioning available.",
    dataType: "boolean",
    allowedUnits: [],
    category: "hearing_augmentation",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 90,
  },
  tactile_wayfinding: {
    key: "tactile_wayfinding",
    label: "Tactile wayfinding",
    description: "Tactile ground surface indicators or tactile maps.",
    dataType: "boolean",
    allowedUnits: [],
    category: "tactile_signage",
    routeRelevant: true,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 365,
  },
  audio_wayfinding: {
    key: "audio_wayfinding",
    label: "Audio wayfinding",
    description: "Audible announcements or audio guidance.",
    dataType: "boolean",
    allowedUnits: [],
    category: "signage",
    routeRelevant: true,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  assistance_animal_access: {
    key: "assistance_animal_access",
    label: "Assistance animal access",
    description: "Assistance animals welcome.",
    dataType: "boolean",
    allowedUnits: [],
    category: "assistance_animal",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 365,
  },
  staff_assistance: {
    key: "staff_assistance",
    label: "Staff assistance",
    description: "Staff available to assist on arrival.",
    dataType: "boolean",
    allowedUnits: [],
    category: "staff_assistance",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 90,
  },
  plain_language_instructions: {
    key: "plain_language_instructions",
    label: "Plain-language information",
    description: "Arrival and wayfinding information in plain language.",
    dataType: "boolean",
    allowedUnits: [],
    category: "online_information",
    routeRelevant: false,
    prefersDirectMeasurement: false,
    defaultFreshnessDays: 180,
  },
  seating_interval_m: {
    key: "seating_interval_m",
    label: "Seating interval",
    description: "Maximum distance between rest seats.",
    dataType: "number",
    allowedUnits: ["m"],
    category: "seating",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 180,
  },
  surface_type: {
    key: "surface_type",
    label: "Surface type",
    description: "Floor or path surface classification.",
    dataType: "enum",
    allowedUnits: [],
    category: "external_path",
    routeRelevant: true,
    prefersDirectMeasurement: true,
    defaultFreshnessDays: 365,
    enumValues: ["smooth", "carpet", "gravel", "uneven", "cobble"],
  },
};

export function getOntologyFeature(key: string): OntologyFeatureMeta | undefined {
  return ACCESS_ONTOLOGY[key];
}

export function listOntologyByCategory(category: string): OntologyFeatureMeta[] {
  return Object.values(ACCESS_ONTOLOGY).filter((f) => f.category === category);
}

export function ontologyLabel(key: string): string {
  return ACCESS_ONTOLOGY[key]?.label ?? key.replaceAll("_", " ");
}

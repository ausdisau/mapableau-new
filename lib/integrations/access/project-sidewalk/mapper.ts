import {
  createUnverifiedProvenance,
  evidenceRefSchema,
  normalizedObservationSchema,
  type NormalizedObservation,
} from "../contracts";
import { projectSidewalkLabelSchema } from "./schemas";

const LABEL_TO_FEATURE: Record<string, { featureType: string; attribute: string }> = {
  CurbRamp: { featureType: "kerb_ramp", attribute: "present" },
  NoCurbRamp: { featureType: "kerb_ramp", attribute: "missing" },
  Obstacle: { featureType: "path_obstacle", attribute: "present" },
  SurfaceProblem: { featureType: "path_surface", attribute: "problem" },
  NoSidewalk: { featureType: "sidewalk", attribute: "missing" },
  Crosswalk: { featureType: "crossing", attribute: "marked" },
  Signal: { featureType: "crossing_signal", attribute: "present" },
  Occlusion: { featureType: "imagery", attribute: "occluded" },
  Other: { featureType: "other_barrier", attribute: "reported" },
};

export function mapProjectSidewalkLabel(
  raw: unknown,
): NormalizedObservation {
  const parsed = projectSidewalkLabelSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid Project Sidewalk label: ${parsed.error.message}`);
  }
  const label = parsed.data;
  const mapping =
    LABEL_TO_FEATURE[label.label_type] ?? LABEL_TO_FEATURE.Other;
  const lat = label.lat ?? label.latitude;
  const lng = label.lng ?? label.longitude;
  const sourceId = String(label.label_id);

  const evidenceRefs = label.image_url
    ? [
        evidenceRefSchema.parse({
          id: `project_sidewalk:${sourceId}:image`,
          kind: "image",
          uri: label.image_url,
          publicationState: "PRIVATE_EVIDENCE",
        }),
      ]
    : [
        evidenceRefSchema.parse({
          id: `project_sidewalk:${sourceId}:label`,
          kind: "label",
          publicationState: "PRIVATE_EVIDENCE",
        }),
      ];

  const provenance = createUnverifiedProvenance({
    sourceProvider: "project_sidewalk",
    sourceReference: sourceId,
    contributorType: "COMMUNITY",
    evidenceRefs,
    attribution: "Project Sidewalk",
    licence: "See Project Sidewalk data terms for city dataset",
    capturedAt: label.time_created,
    // Severity is source metadata — not MapAble verification.
    confidence: undefined,
  });

  return normalizedObservationSchema.parse({
    featureType: mapping.featureType,
    attribute: mapping.attribute,
    value: label.severity == null ? "UNKNOWN" : label.severity,
    valueQualifier: "EXPERIENCED",
    geometry:
      typeof lat === "number" && typeof lng === "number"
        ? { type: "Point", coordinates: [lng, lat] }
        : undefined,
    observedAt: label.time_created,
    notes: [
      `Project Sidewalk label_type=${label.label_type}`,
      label.description ? `description=${label.description}` : null,
      "Source severity is not MapAble verification.",
    ]
      .filter(Boolean)
      .join(" · "),
    provenance,
    claimStrength: "observation",
  });
}

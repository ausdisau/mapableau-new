import { z } from "zod";

export const accessIndoorPoiTypeSchema = z.enum([
  "entrance",
  "accessible_toilet",
  "changing_places",
  "lift",
  "ramp",
  "stairs",
  "help_point",
  "quiet_room",
  "parking",
  "reception",
  "other",
]);

export const indoorPoiInputSchema = z.object({
  type: accessIndoorPoiTypeSchema,
  name: z.string().min(1).max(120),
  xNorm: z.number().min(0).max(1),
  yNorm: z.number().min(0).max(1),
  accessibleRouteOnly: z.boolean().optional(),
  featureType: z
    .enum([
      "step_free_entry",
      "accessible_parking",
      "accessible_toilet",
      "changing_places",
      "lift_access",
      "ramp_access",
      "wide_doorways",
      "wide_paths",
      "hearing_loop",
      "braille_tactile_signage",
      "quiet_space",
      "low_sensory_environment",
      "assistance_animals_welcome",
      "accessible_dropoff",
      "public_transport_nearby",
    ])
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const upsertIndoorFloorSchema = z.object({
  buildingId: z.string().min(1).optional(),
  buildingName: z.string().min(1).max(200).optional(),
  levelIndex: z.number().int().min(-10).max(50),
  label: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
  status: z.enum(["draft", "published"]).optional(),
  floorPlanImageUrl: z.string().url().max(2000).nullable().optional(),
  imageBounds: z.record(z.string(), z.unknown()).optional(),
  widthMeters: z.number().positive().optional(),
  heightMeters: z.number().positive().optional(),
  pois: z.array(indoorPoiInputSchema).optional(),
});

export const adminIndoorImportSchema = z.object({
  placeId: z.string().min(1),
  buildingName: z.string().min(1).max(200),
  externalVendorId: z.string().max(200).optional(),
  positioningVendor: z
    .enum([
      "none",
      "bindimaps",
      "mapsindoors",
      "mappedin",
      "arcgis_indoors",
      "custom",
    ])
    .optional(),
  positioningEmbedUrl: z.string().url().max(2000).optional(),
  floors: z.array(
    z.object({
      levelIndex: z.number().int(),
      label: z.string().min(1).max(80),
      floorPlanImageUrl: z.string().url().max(2000).optional(),
      pois: z.array(indoorPoiInputSchema),
      edges: z
        .array(
          z.object({
            fromName: z.string().min(1),
            toName: z.string().min(1),
            weight: z.number().positive().optional(),
            requiresStairs: z.boolean().optional(),
            accessibleOnly: z.boolean().optional(),
          })
        )
        .optional(),
    })
  ),
});

export const indoorRouteQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  wheelchair: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  avoidStairs: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

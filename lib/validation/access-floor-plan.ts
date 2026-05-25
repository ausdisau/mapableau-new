import { z } from "zod";

export const accessFloorPlanMarkerTypeSchema = z.enum([
  "entrance",
  "exit",
  "accessible_toilet",
  "lift",
  "stairs",
  "ramp",
  "accessible_parking",
  "reception",
  "service_counter",
  "seating",
  "sensory_quiet_area",
  "path_of_travel",
  "hazard",
  "other",
]);

export const accessFloorPlanMarkerConfidenceSchema = z.enum([
  "venue_provided",
  "mapable_verified",
  "community_reported",
]);

export const floorPlanMetadataSchema = z.object({
  title: z.string().min(2).max(160),
  levelLabel: z.string().max(80).optional(),
  altText: z.string().min(10).max(500),
  publicNotes: z.string().max(2000).optional(),
  width: z.coerce.number().int().positive().max(20000).optional(),
  height: z.coerce.number().int().positive().max(20000).optional(),
});

export const updateFloorPlanSchema = floorPlanMetadataSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const createFloorPlanMarkerSchema = z.object({
  type: accessFloorPlanMarkerTypeSchema.default("other"),
  title: z.string().min(2).max(120),
  description: z.string().max(1200).optional(),
  xPercent: z.coerce.number().min(0).max(100),
  yPercent: z.coerce.number().min(0).max(100),
  confidence: accessFloorPlanMarkerConfidenceSchema.default("venue_provided"),
  severity: z.string().max(80).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

export const updateFloorPlanMarkerSchema =
  createFloorPlanMarkerSchema.partial();

export type FloorPlanMetadataInput = z.infer<typeof floorPlanMetadataSchema>;
export type CreateFloorPlanMarkerInput = z.infer<
  typeof createFloorPlanMarkerSchema
>;

import { z } from "zod";

/**
 * Project Sidewalk label payloads (untrusted).
 * Upstream: https://sidewalk-sea.cs.washington.edu / Project Sidewalk research APIs.
 * Labels are observations — never verified MapAble capabilities.
 */

export const PROJECT_SIDEWALK_LABEL_TYPES = [
  "CurbRamp",
  "NoCurbRamp",
  "Obstacle",
  "SurfaceProblem",
  "NoSidewalk",
  "Crosswalk",
  "Signal",
  "Occlusion",
  "Other",
] as const;

export const projectSidewalkLabelSchema = z
  .object({
    label_id: z.union([z.string(), z.number()]),
    label_type: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    severity: z.number().min(1).max(5).optional().nullable(),
    time_created: z.string().optional(),
    gsv_panorama_id: z.string().optional(),
    description: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    city: z.string().optional(),
  })
  .passthrough();

export type ProjectSidewalkLabel = z.infer<typeof projectSidewalkLabelSchema>;

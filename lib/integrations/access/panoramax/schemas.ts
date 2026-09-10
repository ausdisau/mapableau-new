import { z } from "zod";

/** Untrusted Panoramax / GeoVisio STAC-ish payloads. Docs: https://docs.panoramax.fr/ */

export const panoramaxItemSchema = z
  .object({
    type: z.literal("Feature").optional(),
    id: z.string().min(1),
    geometry: z
      .object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]).rest(z.number()),
      })
      .optional(),
    properties: z
      .object({
        datetime: z.string().optional(),
        licence: z.string().optional(),
        license: z.string().optional(),
      })
      .passthrough()
      .optional(),
    assets: z
      .record(
        z.string(),
        z.object({
          href: z.string().min(1),
          type: z.string().optional(),
          roles: z.array(z.string()).optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

export type PanoramaxItem = z.infer<typeof panoramaxItemSchema>;

export const panoramaxApiRootSchema = z
  .object({
    title: z.string().optional(),
    version: z.string().optional(),
    stac_version: z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();

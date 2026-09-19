import { z } from "zod";

/**
 * Overture-compatible base geography boundary.
 * MapAble owns accessibility evidence — Overture may supply places/buildings/paths.
 *
 * Evaluated against Overture docs (places CDLA/Apache; transportation ODbL due to OSM).
 * Do NOT bulk-load the planet. Prefer fixtures / regional subsets / on-demand.
 *
 * @see https://docs.overturemaps.org/
 */

export const geographyQuerySchema = z
  .object({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    theme: z
      .enum(["places", "buildings", "transportation", "base"])
      .default("places"),
    limit: z.number().int().positive().max(500).default(50),
  })
  .strict();

export type GeographyQuery = z.infer<typeof geographyQuerySchema>;

export const baseGeographyFeatureSchema = z
  .object({
    id: z.string().min(1),
    externalId: z.string().min(1),
    sourceProvider: z.literal("overture"),
    theme: z.string().min(1),
    featureType: z.string().min(1),
    name: z.string().optional(),
    geometry: z.object({
      type: z.enum(["Point", "LineString", "Polygon", "MultiPolygon"]),
      coordinates: z.unknown(),
    }),
    licence: z.string().optional(),
    attribution: z.string().optional(),
    /** Overture GERS / release id when available — never MapAble Place id. */
    gersId: z.string().optional(),
  })
  .strict();

export type BaseGeographyFeature = z.infer<typeof baseGeographyFeatureSchema>;

export interface BaseGeographyProvider {
  readonly providerId: "overture" | "sandbox";
  isEnabled(): boolean;
  getFeatures(query: GeographyQuery): Promise<BaseGeographyFeature[]>;
}

/** Development fixture — Sydney CBD sample; not live Overture data. */
export const OVERTURE_SANDBOX_FIXTURES: BaseGeographyFeature[] = [
  baseGeographyFeatureSchema.parse({
    id: "fixture:parramatta-library",
    externalId: "overture:place:fixture-parramatta-library",
    sourceProvider: "overture",
    theme: "places",
    featureType: "place",
    name: "Parramatta Library (fixture)",
    geometry: {
      type: "Point",
      coordinates: [151.002, -33.815],
    },
    licence: "fixture-not-overture-data",
    attribution: "MapAble development fixture — not Overture production data",
  }),
];

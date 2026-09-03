import { openInfrastructureFlags } from "../flags";
import {
  geographyQuerySchema,
  OVERTURE_SANDBOX_FIXTURES,
  type BaseGeographyFeature,
  type BaseGeographyProvider,
  type GeographyQuery,
} from "./types";

/**
 * Overture base-geography provider boundary.
 * Live GeoParquet/S3 access is NOT activated — fixtures only until a regional pilot.
 */
export class OvertureBaseGeographyProvider implements BaseGeographyProvider {
  readonly providerId = "overture" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.overtureBaseGeography;
  }

  async getFeatures(query: GeographyQuery): Promise<BaseGeographyFeature[]> {
    if (!this.isEnabled()) {
      throw new Error("Overture base geography is disabled");
    }
    const parsed = geographyQuerySchema.parse(query);
    // No planet import. Return fixtures filtered by bbox when provided.
    return OVERTURE_SANDBOX_FIXTURES.filter((feature) => {
      if (parsed.theme && feature.theme !== parsed.theme && parsed.theme !== "places") {
        return feature.theme === parsed.theme;
      }
      if (!parsed.bbox) return true;
      if (feature.geometry.type !== "Point") return true;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const [minLng, minLat, maxLng, maxLat] = parsed.bbox;
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    }).slice(0, parsed.limit);
  }
}

export const overtureBaseGeographyProvider =
  new OvertureBaseGeographyProvider();

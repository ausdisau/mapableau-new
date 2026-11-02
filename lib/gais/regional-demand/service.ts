import type {
  GaisRegionLevel,
  GaisRegionalDemandFeature,
} from "@/lib/gais/regional-demand/contracts";
import { REGIONAL_DEMAND_FIXTURES } from "@/lib/gais/regional-demand/fixtures";

export type RegionalDemandBounds = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

function polygonBounds(
  feature: GaisRegionalDemandFeature,
): RegionalDemandBounds {
  const points = feature.geometry.coordinates.flat();
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  };
}

function intersects(
  a: RegionalDemandBounds,
  b: RegionalDemandBounds,
): boolean {
  return !(
    a.maxLng < b.minLng ||
    a.minLng > b.maxLng ||
    a.maxLat < b.minLat ||
    a.minLat > b.maxLat
  );
}

export async function listRegionalDemandFeatures({
  level,
  bounds,
  source = REGIONAL_DEMAND_FIXTURES,
}: {
  level: GaisRegionLevel;
  bounds?: RegionalDemandBounds;
  source?: GaisRegionalDemandFeature[];
}): Promise<GaisRegionalDemandFeature[]> {
  return source.filter(
    (feature) =>
      feature.regionLevel === level &&
      (!bounds || intersects(polygonBounds(feature), bounds)),
  );
}

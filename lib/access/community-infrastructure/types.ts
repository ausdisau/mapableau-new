import type { GaisPoint } from "@/lib/gais/contracts/geometry";
import type { GaisGeoJsonFeatureProperties } from "@/lib/gais/geojson/converters";

import type { CouncilJurisdiction, CouncilLinkage } from "./council-types";

export type CommunityAreaId = "parramatta" | "penrith" | "blacktown";
export type CommunityCategory = "parking" | "toilet" | "public_space";
export type WheelchairStatus =
  | "yes"
  | "limited"
  | "no"
  | "designated"
  | "unknown";
export type CommunityArea = {
  id: CommunityAreaId;
  label: string;
  /** West, south, east, north. Study window, not an administrative boundary. */
  bbox: [number, number, number, number];
};

export type CommunitySource = {
  id: string;
  url: string;
  licence: "ODbL-1.0";
  licenceUrl: string;
  attribution: string;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  /** Raw source date; never replaced with edit or retrieval time. */
  checkedAt: string | null;
  checkedScope: string | null;
  osmVersion: number | null;
};

export type CommunityInfrastructureFeature = {
  type: "Feature";
  id: string;
  geometry: GaisPoint;
  properties: GaisGeoJsonFeatureProperties & {
    id: string;
    name: string;
    area: CommunityAreaId;
    category: CommunityCategory;
    facilityKind: string;
    wheelchair: WheelchairStatus;
    geometryRole: "mapped_point" | "approximate_bbox_centre";
    routeEndpoint: false;
    accessFacts: Array<{ key: string; label: string; value: string }>;
    source: CommunitySource;
    sourceTags: Record<string, string>;
    /** Boundary association for the display point; separate from OSM access evidence. */
    councilJurisdiction?: CouncilJurisdiction;
  };
};

export type CommunityInfrastructureCollection = {
  type: "FeatureCollection";
  features: CommunityInfrastructureFeature[];
  meta: {
    schemaVersion: "1.0.0";
    generatedAt: string | null;
    area: CommunityAreaId | "all";
    areas: CommunityArea[];
    featureCount: number;
    totalMatched: number;
    truncated: boolean;
    dataStatus: "source_snapshot" | "not_loaded";
    claimState: "source_reported_not_independently_verified";
    evidenceScope: string;
    liveNationalRouting: false;
    notice: string;
    attribution: string;
    councilLinkage?: CouncilLinkage;
    sources: Array<{
      id: string;
      url: string;
      licence: string;
      licenceUrl: string;
    }>;
  };
};

export type CommunitySnapshot = {
  schemaVersion: "1.0.0";
  generatedAt: string | null;
  areas: Partial<
    Record<
      CommunityAreaId,
      {
        retrievedAt: string;
        osmBaseTimestamp: string | null;
        inputElementCount: number;
        features: CommunityInfrastructureFeature[];
      }
    >
  >;
};

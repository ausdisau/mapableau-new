export type CouncilBoundaryMatch = {
  /** MapAble reference-registry ID, not an ABS geography code. */
  councilId: string;
  councilName: string;
  sourceFeatureId: string;
  sourceObjectId: number;
  /** Source abscode retained verbatim; do not construct another code from it. */
  sourceCode: number;
};

export type CouncilJurisdiction = {
  status: "matched" | "ambiguous" | "unmatched";
  method: "display_point_in_polygon";
  coordinate: [number, number];
  matches: CouncilBoundaryMatch[];
  boundarySourceId: "nsw-spatial-services-lga";
  boundaryRetrievedAt: string;
  assetOwnership: "not_established";
};

export type CouncilSourceLink = {
  id: string;
  title: string;
  url: string;
  categories: string[];
  sourceKind: string;
  reviewedAt: string;
  sourceUpdatedAt: string | null;
  retrievalStatus: string;
  bulkReuseStatus: "not_established";
  importEnabled: false;
  note: string;
};

export type CouncilReference = {
  id: string;
  name: string;
  website: string | null;
  sourceLinks: CouncilSourceLink[];
};

export type CouncilBoundarySource = {
  id: "nsw-spatial-services-lga";
  name: string;
  url: string;
  publisher: string;
  retrievedAt: string;
  licence: "CC-BY-4.0";
  licenceUrl: string;
  attribution: string;
  sourceSpatialReference: 7844;
  outputSpatialReference: 4326;
};

export type CouncilLinkage = {
  mode: "display_point_boundary_match";
  boundarySource: CouncilBoundarySource;
  councils: Array<CouncilReference & { featureCount: number }>;
  ambiguousFeatureCount: number;
  unmatchedFeatureCount: number;
  notJoinedFeatureCount: number;
  notice: string;
};

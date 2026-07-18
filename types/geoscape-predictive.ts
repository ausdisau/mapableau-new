/** Australian state / territory codes used by Geoscape Predictive. */
export type GeoscapeStateTerritory =
  | "ACT"
  | "NSW"
  | "NT"
  | "OT"
  | "QLD"
  | "SA"
  | "TAS"
  | "VIC"
  | "WA";

export type GeoscapeSuggestItem = {
  id: string;
  address: string;
  rank?: number;
};

export type GeoscapeSuggestResult = {
  suggest: GeoscapeSuggestItem[];
};

export type GeoscapeResolvedAddress = {
  /** Predictive suggestion id used to fetch this record. */
  id: string;
  /** G-NAF address identifier when present. */
  gnafId?: string;
  formattedAddress: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
};

export type GeoscapePredictiveErrorCode =
  | "GEOSCAPE_NOT_CONFIGURED"
  | "GEOSCAPE_UPSTREAM_ERROR"
  | "GEOSCAPE_VALIDATION_ERROR"
  | "GEOSCAPE_NOT_FOUND";

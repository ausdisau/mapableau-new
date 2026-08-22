/** Maximum search radius in metres (~5 km). */
export const GAIS_MAX_RADIUS_METRES = 5000;

/** Default result limit for structured queries. */
export const GAIS_QUERY_DEFAULT_LIMIT = 100;

/** Allowed explicit query objectives — never implicit "best accessible". */
export const GAIS_QUERY_OBJECTIVES = [
  "MOST_VERIFIED",
  "LOWEST_GRADIENT",
  "NEAREST",
] as const;

export type GaisQueryObjective = (typeof GAIS_QUERY_OBJECTIVES)[number];

export const GAIS_QUERY_SCOPES = [
  "MATCHED_KNOWN_FACTS",
  "KNOWN_CONFLICTS",
  "UNKNOWN",
] as const;

export type GaisQueryScope = (typeof GAIS_QUERY_SCOPES)[number];

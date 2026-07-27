/** Client-safe worker screening constants (no server-only imports). */

export const AU_JURISDICTIONS = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
] as const;

export type AuJurisdiction = (typeof AU_JURISDICTIONS)[number];

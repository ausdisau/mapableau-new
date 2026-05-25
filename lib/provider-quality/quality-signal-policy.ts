export const PUBLIC_QUALITY_LABELS = [
  "Verified information available",
  "Responds quickly",
  "Reliable booking history",
  "Access needs clearly listed",
  "New provider, limited history",
  "Quality information unavailable",
  "Temporarily not booking eligible",
] as const;

export function labelForNewProvider(): string {
  return "New provider, limited history";
}

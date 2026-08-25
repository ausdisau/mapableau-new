export const HOME_PRIVACY_ZONES = [
  "SHARED",
  "PERSONAL",
  "HIGHLY_PRIVATE",
  "SECURITY_SENSITIVE",
] as const;

export type HomePrivacyZone = (typeof HOME_PRIVACY_ZONES)[number];

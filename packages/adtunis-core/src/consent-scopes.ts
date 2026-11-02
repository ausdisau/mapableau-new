/** MapAble ConsentScope string values used by Adtunis adapters. */
export const ADTUNIS_CONSENT_SCOPES = {
  transcription: "adtunis.transcription",
  personalisation: "adtunis.personalisation",
  research: "adtunis.research",
  audioRetain: "adtunis.audio_retain",
} as const;

export type AdtunisMapAbleConsentScope =
  (typeof ADTUNIS_CONSENT_SCOPES)[keyof typeof ADTUNIS_CONSENT_SCOPES];

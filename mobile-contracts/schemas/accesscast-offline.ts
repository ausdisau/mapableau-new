import { z } from "zod";

/**
 * Companion offline AccessCast Visit Pack projection schema.
 * Aligns with lib/accesscast/offline.ts — never present as silently current.
 */
export const accessCastOfflinePackSchema = z
  .object({
    schemaVersion: z.literal(1),
    packKind: z.literal("accesscast_offline_outlook"),
    forecastId: z.string().min(1),
    missionId: z.string().min(1),
    placeRef: z.string().min(1),
    journeyLabel: z.string().min(1).max(500),
    generatedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    intendedJourneyTime: z.string().datetime({ offset: true }),
    conclusionState: z.enum([
      "stable",
      "likely_usable",
      "fragile",
      "degraded",
      "temporarily_unavailable",
      "cannot_confirm",
      "conflicting",
      "stale",
      "unknown",
    ]),
    plainLanguageSummary: z.string().max(4000),
    why: z.array(z.string().max(500)).max(30),
    suggestedChecks: z.array(z.string().max(500)).max(20),
    timelinePlainText: z.string().max(8000),
    segmentSummaries: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          state: z.string(),
          evidenceSummary: z.string().max(1000),
        }),
      )
      .max(40),
    fallbackSummary: z.string().max(2000).nullable(),
    confidenceHorizon: z.string().datetime({ offset: true }),
    contentHash: z.string().min(16),
    limitations: z.array(z.string().max(500)).max(40),
    offlineBounded: z.literal(true),
    mustShowGeneratedAndExpiry: z.literal(true),
    redacted: z.literal(true),
    synthetic: z.boolean(),
    productionClaim: z.literal("none"),
  })
  .strict();

export type AccessCastOfflinePackContract = z.infer<typeof accessCastOfflinePackSchema>;

export const ACCESSCAST_OFFLINE_STORAGE_KEY_CONTRACT =
  "companion.accesscast.outlook.v1" as const;

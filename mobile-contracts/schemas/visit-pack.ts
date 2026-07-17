import { z } from "zod";

/**
 * Companion Offline Visit Pack contract (Connected Capability Wave 8).
 * Not a shipped native app — contract only.
 */
export const offlineMissionPackSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  missionRef: z.string(),
  communicationPassportSummary: z.record(z.string(), z.unknown()),
  careAndTransport: z.record(z.string(), z.unknown()),
  equipmentSignals: z.array(z.record(z.string(), z.unknown())),
  issuedAt: z.string(),
  expiresAt: z.string(),
  encryptedPayloadHint: z.literal("secure_store_required"),
  isSynthetic: z.boolean().optional(),
});

export type OfflineMissionPackContract = z.infer<
  typeof offlineMissionPackSchema
>;

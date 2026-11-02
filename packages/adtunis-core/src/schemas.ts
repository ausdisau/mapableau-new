import { z } from "zod";

export const adtunisConsentSchema = z
  .object({
    transcription: z.boolean(),
    personalisation: z.boolean(),
    research: z.boolean(),
  })
  .strict();

export const adtunisAccessibilitySchema = z
  .object({
    fontScale: z.number().min(1).max(2),
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
    switchNavigation: z.boolean(),
  })
  .strict();

export const audioRetentionSchema = z.enum([
  "process-only",
  "retain-privately",
]);

export const captureStateSchema = z.enum([
  "idle",
  "capturing",
  "stopped",
]);

export const recognitionUncertaintySchema = z.enum([
  "low",
  "moderate",
  "unknown",
]);

export const recognitionSchema = z
  .object({
    id: z.string().min(1),
    raw: z.string(),
    alternatives: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).nullable(),
    uncertainty: recognitionUncertaintySchema,
    confirmed: z.string().nullable().default(null),
    createdAt: z.string(),
    audioObjectPath: z.string().nullable().optional(),
    audioExpiresAt: z.string().nullable().optional(),
  })
  .strict();

export const correctionSchema = z
  .object({
    id: z.string().min(1),
    recognitionId: z.string().min(1),
    original: z.string(),
    expression: z.string(),
    createdAt: z.string(),
    trainingStatus: z.enum(["available", "included", "consumed"]),
  })
  .strict();

export const activitySchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    detail: z.string(),
    type: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const workspaceSchema = z
  .object({
    demo: z.boolean().default(true),
    participantName: z.string().default("Your workspace"),
    consent: adtunisConsentSchema,
    audioRetention: audioRetentionSchema,
    accessibility: adtunisAccessibilitySchema,
    captureState: captureStateSchema,
    message: z.string(),
    recognitions: z.array(recognitionSchema),
    corrections: z.array(correctionSchema),
    activity: z.array(activitySchema),
    lastDelivery: z
      .object({
        id: z.string(),
        mode: z.enum(["mock", "live"]),
        label: z.string(),
        conversationId: z.string().nullable(),
        expression: z.string(),
        createdAt: z.string(),
      })
      .nullable()
      .default(null),
  })
  .strict();

export const workspaceActionSchema = z
  .object({
    type: z.enum([
      "startCapture",
      "stopCapture",
      "confirmExpression",
      "addCorrection",
      "deleteCorrection",
      "saveConsent",
      "saveAudioRetention",
      "saveAccessibility",
      "deleteData",
      "ingestRecognition",
    ]),
    id: z.string().optional(),
    text: z.string().optional(),
    consent: adtunisConsentSchema.optional(),
    audioRetention: audioRetentionSchema.optional(),
    accessibility: adtunisAccessibilitySchema.optional(),
    recognition: recognitionSchema.optional(),
  })
  .strict();

export const intentConfirmationSchema = z
  .object({
    recognitionId: z.string().min(1).optional(),
    expression: z.string().min(1).max(10000),
    conversationId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(8).max(128),
    confirmed: z.literal(true),
  })
  .strict();

export const bridgeRequestSchema = z
  .object({
    protocol: z.literal("adtunis.bridge.v1"),
    id: z.string().uuid(),
    method: z.enum([
      "app.getCapabilities",
      "speech.requestMicrophonePermission",
      "speech.startCapture",
      "speech.stopCapture",
      "speech.recognize",
      "speech.confirmCorrection",
      "speech.listProfiles",
      "speech.activateProfile",
      "speech.deactivateProfile",
      "model.getStatus",
      "model.startPersonalisationJob",
    ]),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AdtunisConsent = z.infer<typeof adtunisConsentSchema>;
export type AdtunisAccessibility = z.infer<typeof adtunisAccessibilitySchema>;
export type AudioRetention = z.infer<typeof audioRetentionSchema>;
export type CaptureState = z.infer<typeof captureStateSchema>;
export type Recognition = z.infer<typeof recognitionSchema>;
export type Correction = z.infer<typeof correctionSchema>;
export type AdtunisWorkspace = z.infer<typeof workspaceSchema>;
export type WorkspaceAction = z.infer<typeof workspaceActionSchema>;
export type IntentConfirmation = z.infer<typeof intentConfirmationSchema>;
export type BridgeRequest = z.infer<typeof bridgeRequestSchema>;

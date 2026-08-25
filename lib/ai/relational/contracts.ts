import { z } from "zod";

import {
  RELATIONAL_CONSENT_PURPOSES,
  type RelationalConsentPurpose,
} from "@/lib/ai/relational/consent-purposes";
import { RELATIONAL_CONSTITUTION_VERSION } from "@/lib/ai/relational/constitution";
import { RELATIONAL_POLICY_VERSION } from "@/lib/ai/relational/types";

/** AssistanceMode: what kind of help the participant wants. */
export const ASSISTANCE_MODES = [
  "LISTEN",
  "EXPLAIN",
  "COMPARE",
  "DRAFT",
  "PERSON",
] as const;
export type AssistanceMode = (typeof ASSISTANCE_MODES)[number];
export const assistanceModeSchema = z.enum(ASSISTANCE_MODES);

/** ParticipantControl: immediate control signals. */
export const PARTICIPANT_CONTROLS = [
  "STOP",
  "WAIT",
  "NO",
  "NOT_THAT",
  "TRY_AGAIN",
  "CORRECT",
  "CHANGE_DECISION",
] as const;
export type ParticipantControl = (typeof PARTICIPANT_CONTROLS)[number];
export const participantControlSchema = z.enum(PARTICIPANT_CONTROLS);

export const IMMEDIATE_STOP_CONTROLS = ["STOP", "WAIT", "NO"] as const;

export function isImmediateStopControl(value: string): boolean {
  return (IMMEDIATE_STOP_CONTROLS as readonly string[]).includes(value);
}

const provenanceSchema = z
  .object({
    source: z.enum(["participant", "authorised_delegate", "system"]),
    recordedAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable().optional(),
    actorUserId: z.string().min(1).max(120).optional(),
  })
  .strict();

/** Participant-supplied communication preferences — never inferred. */
export const communicationPreferenceSchema = z
  .object({
    pace: z.enum(["slower", "standard", "faster"]).optional(),
    length: z.enum(["short", "medium", "detailed"]).optional(),
    vocabulary: z.enum(["plain", "standard", "technical"]).optional(),
    format: z
      .enum(["text", "bullet", "one_question", "aac_compatible"])
      .optional(),
    aacOrTextNeeds: z.string().max(500).optional(),
    sensoryPreferences: z.array(z.string().max(120)).max(20).optional(),
    allowLongPauses: z.boolean().default(true),
    saveAndResume: z.boolean().default(true),
    provenance: provenanceSchema,
  })
  .strict();

export type RelationalCommunicationPreference = z.infer<
  typeof communicationPreferenceSchema
>;

export function isCommunicationPreferenceExpired(
  pref: RelationalCommunicationPreference,
  nowIso: string = new Date().toISOString(),
): boolean {
  const expiresAt = pref.provenance.expiresAt;
  if (!expiresAt) return false;
  return expiresAt < nowIso;
}

/** Explicit self-report: participant's own words — never a model-derived label. */
export const confirmationStates = [
  "unconfirmed",
  "participant_confirmed",
  "authorised_human_confirmed",
  "corrected",
  "withdrawn",
] as const;
export type ConfirmationState = (typeof confirmationStates)[number];

export const explicitSelfReportSchema = z
  .object({
    text: z.string().min(1).max(2000),
    purpose: z.enum(RELATIONAL_CONSENT_PURPOSES),
    confirmationState: z.enum(confirmationStates),
    reportedAt: z.string().datetime(),
    /** Must never carry model-derived affect/capacity labels. */
    labels: z
      .array(z.string().max(80))
      .max(0)
      .default([])
      .describe("Derived labels are prohibited; must be empty."),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.labels.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Derived labels on ExplicitSelfReport are prohibited",
        path: ["labels"],
      });
    }
  });

export type ExplicitSelfReport = z.infer<typeof explicitSelfReportSchema>;

/** Structured interpretation — purpose-limited, confirmation-gated. */
export const structuredInterpretationSchema = z
  .object({
    purpose: z.enum(RELATIONAL_CONSENT_PURPOSES),
    fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    sourceUtteranceRef: z.string().max(120).nullable().optional(),
    redactedProvenance: z.string().max(500).nullable().optional(),
    assumptions: z.array(z.string().max(300)).max(20).default([]),
    uncertaintyNotes: z.array(z.string().max(300)).max(20).default([]),
    nonNegotiableConstraints: z.array(z.string().max(200)).max(30).default([]),
    confirmationState: z.enum(confirmationStates),
    revision: z.number().int().min(0).default(0),
    previousRevisionRef: z.string().max(120).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const prohibitedKeys = [
      "emotion",
      "sentiment",
      "capacity",
      "risk_score",
      "diagnosis",
      "deception",
      "employability",
    ];
    for (const key of Object.keys(value.fields)) {
      if (prohibitedKeys.some((p) => key.toLowerCase().includes(p))) {
        ctx.addIssue({
          code: "custom",
          message: `Prohibited inference field rejected: ${key}`,
          path: ["fields", key],
        });
      }
    }
  });

export type StructuredInterpretation = z.infer<
  typeof structuredInterpretationSchema
>;

export function canConfirmInterpretation(
  interpretation: StructuredInterpretation,
  evidence: {
    participantConfirmed?: boolean;
    authorisedHumanConfirmed?: boolean;
  },
): boolean {
  if (interpretation.confirmationState === "withdrawn") return false;
  return Boolean(
    evidence.participantConfirmed || evidence.authorisedHumanConfirmed,
  );
}

export function applyInterpretationCorrection(input: {
  current: StructuredInterpretation;
  correctionNote: string;
  nextFields: StructuredInterpretation["fields"];
}): StructuredInterpretation {
  return structuredInterpretationSchema.parse({
    ...input.current,
    fields: input.nextFields,
    assumptions: [
      ...input.current.assumptions,
      `correction:${input.correctionNote.slice(0, 200)}`,
    ],
    confirmationState: "corrected",
    revision: input.current.revision + 1,
    previousRevisionRef: `rev:${input.current.revision}`,
  });
}

/** Decision Passport — reviewable, correctable, purpose-minimised. */
export const decisionPassportSchema = z
  .object({
    id: z.string().min(1).max(120),
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    requestSummary: z.string().min(1).max(500),
    assistanceMode: assistanceModeSchema,
    approvedInterpretation: structuredInterpretationSchema.nullable(),
    hardConstraints: z.array(z.string().max(200)).max(50).default([]),
    evidenceSources: z
      .array(
        z
          .object({
            label: z.string().max(200),
            freshness: z.enum(["fresh", "stale", "unknown"]).default("unknown"),
          })
          .strict(),
      )
      .max(30)
      .default([]),
    uncertaintyNotes: z.array(z.string().max(300)).max(20).default([]),
    suggestions: z.array(z.string().max(300)).max(20).default([]),
    aiInvolved: z.boolean().default(false),
    corrections: z
      .array(
        z
          .object({
            at: z.string().datetime(),
            note: z.string().max(500),
            revision: z.number().int().min(1),
          })
          .strict(),
      )
      .max(50)
      .default([]),
    consentPurpose: z.enum(RELATIONAL_CONSENT_PURPOSES),
    consentState: z.enum([
      "granted",
      "withdrawn",
      "missing",
      "wrong_purpose",
    ]),
    nextStepOwner: z.enum(["participant", "authorised_delegate", "human_help"]),
    policyVersion: z.literal(RELATIONAL_POLICY_VERSION),
    constitutionVersion: z.literal(RELATIONAL_CONSTITUTION_VERSION),
  })
  .strict();

export type RelationalDecisionPassport = z.infer<typeof decisionPassportSchema>;

/** Policy decision output — no speculative sensitive conclusions. */
export const ALLOWED_RESPONSE_CLASSES = [
  "listen",
  "explain",
  "compare",
  "draft",
  "human_help",
  "deterministic_fallback",
  "refuse",
  "stop",
] as const;
export type AllowedResponseClass = (typeof ALLOWED_RESPONSE_CLASSES)[number];

export const relationalPolicyDecisionSchema = z
  .object({
    policyVersion: z.literal(RELATIONAL_POLICY_VERSION),
    constitutionVersion: z.literal(RELATIONAL_CONSTITUTION_VERSION),
    allowedResponseClass: z.enum(ALLOWED_RESPONSE_CLASSES),
    prohibitedInferenceIndicators: z.array(z.string().max(120)).max(30).default([]),
    prohibitedActionIndicators: z.array(z.string().max(120)).max(30).default([]),
    fallbackRoute: z.enum([
      "deterministic",
      "human_help",
      "non_ai_continue",
      "stop",
    ]),
    assistanceMode: assistanceModeSchema.optional(),
    participantControl: participantControlSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const banned = ["emotion_label", "capacity_flag", "sentiment_score"];
    for (const field of [
      ...value.prohibitedInferenceIndicators,
      ...value.prohibitedActionIndicators,
    ]) {
      // Indicators name prohibitions; storing speculative conclusions is banned via shape.
      void field;
    }
    // Explicitly reject any attempt to smuggle conclusions via unknown keys — .strict handles it.
    void banned;
    void ctx;
  });

export type RelationalPolicyDecision = z.infer<
  typeof relationalPolicyDecisionSchema
>;

export function decideImmediateControl(
  control: ParticipantControl,
): RelationalPolicyDecision {
  if (isImmediateStopControl(control)) {
    return relationalPolicyDecisionSchema.parse({
      policyVersion: RELATIONAL_POLICY_VERSION,
      constitutionVersion: RELATIONAL_CONSTITUTION_VERSION,
      allowedResponseClass: "stop",
      prohibitedInferenceIndicators: [],
      prohibitedActionIndicators: ["continue_after_stop"],
      fallbackRoute: "stop",
      participantControl: control,
    });
  }
  return relationalPolicyDecisionSchema.parse({
    policyVersion: RELATIONAL_POLICY_VERSION,
    constitutionVersion: RELATIONAL_CONSTITUTION_VERSION,
    allowedResponseClass: "listen",
    prohibitedInferenceIndicators: [],
    prohibitedActionIndicators: [],
    fallbackRoute: "deterministic",
    participantControl: control,
  });
}

/** Long pause / timeout must not create negative inference. */
export function policyForLongPause(): RelationalPolicyDecision {
  return relationalPolicyDecisionSchema.parse({
    policyVersion: RELATIONAL_POLICY_VERSION,
    constitutionVersion: RELATIONAL_CONSTITUTION_VERSION,
    allowedResponseClass: "listen",
    prohibitedInferenceIndicators: [
      "timeout_as_refusal",
      "pause_as_incapacity",
      "pause_as_emotion",
    ],
    prohibitedActionIndicators: [],
    fallbackRoute: "deterministic",
  });
}

export type { RelationalConsentPurpose };

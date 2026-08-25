import { z } from "zod";

import {
  DEFAULT_RANKING_WEIGHTS,
  hardConstraintsSchema,
  rankingWeightsSchema,
  type HardConstraints,
  type RankingWeights,
} from "@/lib/ai/navigator/matching/types";

/**
 * Participant-controlled assistance mode — aligned with Decision Passport
 * nextStepController and envelope draft-only semantics.
 */
export const ASSISTANCE_MODES = [
  "participant_led",
  "guided_with_confirm",
  "draft_only",
  "human_only",
  "opt_out_ai",
] as const;

export type AssistanceMode = (typeof ASSISTANCE_MODES)[number];

export const assistanceModeSchema = z.enum(ASSISTANCE_MODES);

/** Empty Stage-1 constraints after Zod defaults (arrays required on output). */
export const EMPTY_HARD_CONSTRAINTS: HardConstraints = {
  requiredServices: [],
  exclusions: [],
  communicationRequirements: [],
  accessibilityRequirements: [],
  credentialRequirements: [],
  nonNegotiableKeys: [],
};

export const DEFAULT_PARTICIPANT_CONTROL = {
  assistanceMode: "guided_with_confirm" as const,
  aiOptedOut: false,
  interpretationConfirmed: false,
  permittedFields: [] as string[],
  nonNegotiableKeys: [] as string[],
  hardConstraints: EMPTY_HARD_CONSTRAINTS,
  rankingWeights: DEFAULT_RANKING_WEIGHTS satisfies RankingWeights,
  humanHelpRequested: false,
  communicationPassportSource: "support.communication_passport" as const,
};

/**
 * Participant control contract — what the participant may change per turn.
 * Mirrors NavigatorPilotJourney permitted fields and passport routes.
 */
export const participantControlSchema = z
  .object({
    assistanceMode: assistanceModeSchema.default(
      DEFAULT_PARTICIPANT_CONTROL.assistanceMode,
    ),
    aiOptedOut: z.boolean().default(DEFAULT_PARTICIPANT_CONTROL.aiOptedOut),
    interpretationConfirmed: z
      .boolean()
      .default(DEFAULT_PARTICIPANT_CONTROL.interpretationConfirmed),
    permittedFields: z
      .array(z.string().max(80))
      .max(20)
      .default(() => [...DEFAULT_PARTICIPANT_CONTROL.permittedFields]),
    nonNegotiableKeys: z
      .array(z.string().max(80))
      .max(20)
      .default(() => [...DEFAULT_PARTICIPANT_CONTROL.nonNegotiableKeys]),
    hardConstraints: hardConstraintsSchema.default(EMPTY_HARD_CONSTRAINTS),
    rankingWeights: rankingWeightsSchema.default(DEFAULT_RANKING_WEIGHTS),
    /** Participant may request human help without model adjudication. */
    humanHelpRequested: z
      .boolean()
      .default(DEFAULT_PARTICIPANT_CONTROL.humanHelpRequested),
    /** Communication preferences source-of-truth key (support passport). */
    communicationPassportSource: z
      .literal("support.communication_passport")
      .default(DEFAULT_PARTICIPANT_CONTROL.communicationPassportSource),
  })
  .strict();

export type ParticipantControl = z.infer<typeof participantControlSchema>;

export const relationalTurnInputSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    goalText: z.string().max(2000).optional(),
    control: participantControlSchema.default(DEFAULT_PARTICIPANT_CONTROL),
    capabilityKey: z.string().min(1),
    silent: z.boolean().optional(),
  })
  .strict();

/** Call-site input (defaults applied by `relationalTurnInputSchema.parse`). */
export type RelationalTurnInput = z.input<typeof relationalTurnInputSchema>;
/** Parsed turn after Zod defaults. */
export type RelationalTurnParsed = z.infer<typeof relationalTurnInputSchema>;

export type RelationalTurnResult =
  | { status: "allowed"; capabilityKey: string; assistanceMode: AssistanceMode }
  | { status: "blocked"; reason: string; capabilityKey: string }
  | { status: "escalate"; reason: string; capabilityKey: string };

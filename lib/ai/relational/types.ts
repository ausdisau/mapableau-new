import { z } from "zod";

import {
  DEFAULT_RANKING_WEIGHTS,
  hardConstraintsSchema,
  rankingWeightsSchema,
  type HardConstraints,
} from "@/lib/ai/navigator/matching/types";

const DEFAULT_HARD_CONSTRAINTS: HardConstraints = hardConstraintsSchema.parse(
  {},
);

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

/**
 * Participant control contract — what the participant may change per turn.
 * Mirrors NavigatorPilotJourney permitted fields and passport routes.
 */
export const participantControlSchema = z
  .object({
    assistanceMode: assistanceModeSchema.default("guided_with_confirm"),
    aiOptedOut: z.boolean().default(false),
    interpretationConfirmed: z.boolean().default(false),
    permittedFields: z.array(z.string().max(80)).max(20).default([]),
    nonNegotiableKeys: z.array(z.string().max(80)).max(20).default([]),
    hardConstraints: hardConstraintsSchema.default(
      () => ({ ...DEFAULT_HARD_CONSTRAINTS }),
    ),
    rankingWeights: rankingWeightsSchema.default(
      () => ({ ...DEFAULT_RANKING_WEIGHTS }),
    ),
    /** Participant may request human help without model adjudication. */
    humanHelpRequested: z.boolean().default(false),
    /** Communication preferences source-of-truth key (support passport). */
    communicationPassportSource: z
      .literal("support.communication_passport")
      .default("support.communication_passport"),
  })
  .strict();

export type ParticipantControl = z.infer<typeof participantControlSchema>;

const DEFAULT_PARTICIPANT_CONTROL = {
  assistanceMode: "guided_with_confirm" as const,
  aiOptedOut: false,
  interpretationConfirmed: false,
  permittedFields: [] as string[],
  nonNegotiableKeys: [] as string[],
  hardConstraints: { ...DEFAULT_HARD_CONSTRAINTS },
  rankingWeights: { ...DEFAULT_RANKING_WEIGHTS },
  humanHelpRequested: false,
  communicationPassportSource: "support.communication_passport" as const,
};

export const relationalTurnInputSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    goalText: z.string().max(2000).optional(),
    control: participantControlSchema.default(
      () => ({ ...DEFAULT_PARTICIPANT_CONTROL }),
    ),
    capabilityKey: z.string().min(1),
    silent: z.boolean().optional(),
  })
  .strict();

export type RelationalTurnInput = z.infer<typeof relationalTurnInputSchema>;

export type RelationalTurnResult =
  | { status: "allowed"; capabilityKey: string; assistanceMode: AssistanceMode }
  | { status: "blocked"; reason: string; capabilityKey: string }
  | { status: "escalate"; reason: string; capabilityKey: string };

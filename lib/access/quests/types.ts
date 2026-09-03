import { z } from "zod";

/**
 * MapAble-native Access Quests (StreetComplete-inspired interaction, not a copy).
 * Domain objects — not React hard-coding.
 */

export const ACCESS_QUEST_ANSWER_TYPES = [
  "yes_no_unknown",
  "presence",
  "enumerated",
  "measurement",
  "free_text",
] as const;

export const accessQuestSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    concept: z.string().min(1),
    attribute: z.string().min(1),
    question: z.string().min(1),
    helpText: z.string().optional(),
    answerType: z.enum(ACCESS_QUEST_ANSWER_TYPES),
    answerSchema: z.record(z.string(), z.unknown()).default({}),
    locationRequired: z.boolean(),
    evidenceOptional: z.boolean(),
    verificationPolicy: z.enum([
      "community_unverified",
      "needs_corroboration",
      "professional_review",
    ]),
    priorityWeight: z.number().min(0).max(100).default(50),
  })
  .strict();

export type AccessQuest = z.infer<typeof accessQuestSchema>;

export const accessQuestAnswerSchema = z
  .object({
    questId: z.string().min(1),
    placeId: z.string().min(1).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    value: z.union([
      z.literal("yes"),
      z.literal("no"),
      z.literal("unknown"),
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
    ]),
    valueQualifier: z
      .enum(["MEASURED", "ESTIMATED", "EXPERIENCED", "UNKNOWN"])
      .default("UNKNOWN"),
    note: z.string().max(2000).optional(),
    evidenceObjectId: z.string().optional(),
    idempotencyKey: z.string().min(8).max(128),
    /** Pseudonymous/internal actor — never publish. */
    actorRef: z.string().min(1),
  })
  .strict();

export type AccessQuestAnswer = z.infer<typeof accessQuestAnswerSchema>;

export const STARTER_ACCESS_QUESTS: AccessQuest[] = [
  accessQuestSchema.parse({
    id: "entrance.step_free",
    version: 1,
    concept: "entrance",
    attribute: "step_free",
    question: "Is this entrance step-free?",
    helpText: "Step-free means no step or threshold higher than about 15mm.",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "needs_corroboration",
    priorityWeight: 90,
  }),
  accessQuestSchema.parse({
    id: "door.automatic",
    version: 1,
    concept: "door",
    attribute: "automatic",
    question: "Does this doorway open automatically?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 70,
  }),
  accessQuestSchema.parse({
    id: "kerb_ramp.present",
    version: 1,
    concept: "kerb_ramp",
    attribute: "present",
    question: "Is there a kerb ramp here?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "needs_corroboration",
    priorityWeight: 85,
  }),
  accessQuestSchema.parse({
    id: "tactile_paving.present",
    version: 1,
    concept: "tactile_paving",
    attribute: "present",
    question: "Is tactile paving present?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 75,
  }),
  accessQuestSchema.parse({
    id: "lift.operating",
    version: 1,
    concept: "lift",
    attribute: "operating",
    question: "Was this lift operating when you visited?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 95,
  }),
  accessQuestSchema.parse({
    id: "toilet.accessible",
    version: 1,
    concept: "toilet",
    attribute: "accessible_available",
    question: "Is an accessible toilet available?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "needs_corroboration",
    priorityWeight: 88,
  }),
  accessQuestSchema.parse({
    id: "changing_places.available",
    version: 1,
    concept: "changing_places",
    attribute: "available",
    question: "Is a Changing Places facility available?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "needs_corroboration",
    priorityWeight: 80,
  }),
  accessQuestSchema.parse({
    id: "hearing_loop.present",
    version: 1,
    concept: "hearing_loop",
    attribute: "present",
    question: "Is there a hearing loop?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 60,
  }),
  accessQuestSchema.parse({
    id: "quiet_space.available",
    version: 1,
    concept: "quiet_space",
    attribute: "available",
    question: "Is there a quiet/low-sensory space?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 65,
  }),
  accessQuestSchema.parse({
    id: "drop_off.accessible",
    version: 1,
    concept: "drop_off",
    attribute: "accessible",
    question: "Is an accessible drop-off point available?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 70,
  }),
  accessQuestSchema.parse({
    id: "assistance_animal.supported",
    version: 1,
    concept: "assistance_animal",
    attribute: "supported",
    question: "Is assistance-animal access supported?",
    answerType: "yes_no_unknown",
    locationRequired: true,
    evidenceOptional: true,
    verificationPolicy: "community_unverified",
    priorityWeight: 72,
  }),
];

export function getAccessQuestById(id: string): AccessQuest | undefined {
  return STARTER_ACCESS_QUESTS.find((q) => q.id === id);
}

export function listAccessQuests(): AccessQuest[] {
  return [...STARTER_ACCESS_QUESTS];
}

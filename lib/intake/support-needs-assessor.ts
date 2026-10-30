import { z } from "zod";

/** Life areas shown in the registration assessor (subset of I-CAN domains). */
export const SUPPORT_NEEDS_LIFE_AREA_IDS = [
  "mobility",
  "self_care",
  "domestic_life",
  "communication",
  "looking_after_ones_health",
  "community_social_civic_life",
] as const;

export type SupportNeedsLifeAreaId =
  (typeof SUPPORT_NEEDS_LIFE_AREA_IDS)[number];

export const SUPPORT_NEEDS_LIFE_AREAS: readonly {
  id: SupportNeedsLifeAreaId;
  label: string;
  description: string;
}[] = [
  {
    id: "mobility",
    label: "Getting around",
    description: "Moving at home and in the community, transfers, mobility aids.",
  },
  {
    id: "self_care",
    label: "Personal care",
    description: "Washing, dressing, eating, drinking, and toileting.",
  },
  {
    id: "domestic_life",
    label: "Home & daily tasks",
    description: "Meals, cleaning, shopping, and looking after your home.",
  },
  {
    id: "communication",
    label: "Talking & understanding",
    description: "Speech, Auslan, AAC, reading, and being understood.",
  },
  {
    id: "looking_after_ones_health",
    label: "Health & wellbeing",
    description: "Medications, appointments, and looking after your health.",
  },
  {
    id: "community_social_civic_life",
    label: "Community & connections",
    description: "Getting out, social activities, and community life.",
  },
];

/** Plain-language intensity → I-CAN support need level. */
export const SUPPORT_NEEDS_INTENSITY_OPTIONS = [
  {
    value: "a_little",
    label: "A little help",
    description: "Occasional check-ins or reminders are enough.",
  },
  {
    value: "some",
    label: "Some support",
    description: "Regular help with parts of this area.",
  },
  {
    value: "a_lot",
    label: "A lot of support",
    description: "Help with most of this area, most days.",
  },
  {
    value: "all_the_time",
    label: "Support all the time",
    description: "Someone needs to be with me for this area.",
  },
] as const;

export type SupportNeedsIntensity =
  (typeof SUPPORT_NEEDS_INTENSITY_OPTIONS)[number]["value"];

const supportNeedsIntensitySchema = z.enum([
  "a_little",
  "some",
  "a_lot",
  "all_the_time",
]);

const lifeAreaIdSchema = z.enum(SUPPORT_NEEDS_LIFE_AREA_IDS);

function sanitizeNotes(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

const areaAnswerSchema = z.object({
  domainId: lifeAreaIdSchema,
  intensity: supportNeedsIntensitySchema,
});

/**
 * Lite registration assessor body.
 * Either submit answers or skip for later.
 */
export const SupportNeedsAssessorSubmitSchema = z
  .object({
    skipped: z.literal(false).optional(),
    selectedAreas: z.array(lifeAreaIdSchema).min(1).max(6),
    answers: z.array(areaAnswerSchema).min(1).max(6),
    priorityArea: lifeAreaIdSchema.optional(),
    anythingElse: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeNotes(v)))
      .pipe(z.string().max(2000).optional()),
    participantGoal: z.string().max(1000).optional().transform((v) => v === undefined ? undefined : sanitizeNotes(v)),
    communicationAccess: z.string().max(1000).optional().transform((v) => v === undefined ? undefined : sanitizeNotes(v)),
    changingSupportNeeds: z.string().max(1000).optional().transform((v) => v === undefined ? undefined : sanitizeNotes(v)),
    consentDraftProcessing: z.literal(true),
    consentNoClinicalPaste: z.literal(true),
    clientSessionId: z.string().min(1).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const selected = new Set(data.selectedAreas);
    if (selected.size !== data.selectedAreas.length) {
      ctx.addIssue({ code: "custom", path: ["selectedAreas"], message: "Choose each life area only once" });
    }
    if (new Set(data.answers.map((a) => a.domainId)).size !== data.answers.length) {
      ctx.addIssue({ code: "custom", path: ["answers"], message: "Only one answer per life area is allowed" });
    }
    const answered = new Set(data.answers.map((a) => a.domainId));

    for (const id of selected) {
      if (!answered.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Missing intensity answer for ${id}`,
        });
      }
    }

    for (const id of answered) {
      if (!selected.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Answer for unselected area ${id}`,
        });
      }
    }

    if (data.priorityArea && !selected.has(data.priorityArea)) {
      ctx.addIssue({
        code: "custom",
        path: ["priorityArea"],
        message: "Priority area must be one of the selected life areas",
      });
    }
  });

export const SupportNeedsAssessorSkipSchema = z.object({
  skipped: z.literal(true),
});

export const SupportNeedsAssessorBodySchema = z.union([
  SupportNeedsAssessorSkipSchema,
  SupportNeedsAssessorSubmitSchema,
]);

export type SupportNeedsAssessorSubmit = z.infer<
  typeof SupportNeedsAssessorSubmitSchema
>;
export type SupportNeedsAssessorBody = z.infer<
  typeof SupportNeedsAssessorBodySchema
>;

export const REGISTRATION_ASSESSOR_STATUS = "registration_lite" as const;
export const REGISTRATION_ASSESSOR_SKIPPED_STATUS =
  "registration_skipped" as const;

/**
 * Registration support needs are participant self-reports. They must never
 * be auto-converted into I-CAN ratings or treated as clinician findings.
 * See buildParticipantSupportSnapshot for the separate, provenance-labelled model.
 */

/** Type-narrow helper for life-area ids used in the UI. */
export function isSupportNeedsLifeAreaId(
  value: string,
): value is SupportNeedsLifeAreaId {
  return (SUPPORT_NEEDS_LIFE_AREA_IDS as readonly string[]).includes(value);
}


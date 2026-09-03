import { z } from "zod";

/**
 * ODK XLSForm-ish export/import boundary — schema only, no live ODK server.
 */

export const odkFieldSchema = z
  .object({
    name: z.string(),
    type: z.enum(["text", "select_one", "geopoint", "image", "note"]),
    label: z.string(),
    required: z.boolean().default(false),
    choices: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  })
  .strict();

export const odkFormSchema = z
  .object({
    formId: z.string().min(1),
    title: z.string().min(1),
    version: z.string().default("1"),
    fields: z.array(odkFieldSchema),
    defaultLanguage: z.string().default("en"),
  })
  .strict();

export type OdkForm = z.infer<typeof odkFormSchema>;

export const odkSubmissionSchema = z
  .object({
    formId: z.string().min(1),
    instanceId: z.string().min(1),
    submittedAt: z.string(),
    fields: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    ),
    geopoint: z
      .object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      })
      .optional(),
  })
  .strict();

export type OdkSubmission = z.infer<typeof odkSubmissionSchema>;

export function missionToOdkForm(mission: {
  id: string;
  title: string;
  tasks: Array<{ questId: string; label: string }>;
}): OdkForm {
  return odkFormSchema.parse({
    formId: `mapable_mission_${mission.id}`,
    title: mission.title,
    version: "1",
    fields: [
      {
        name: "mission_id",
        type: "note",
        label: "Mission ID",
        required: true,
      },
      ...mission.tasks.map((task) => ({
        name: `quest_${task.questId}`,
        type: "select_one" as const,
        label: task.label,
        required: false,
        choices: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Unknown" },
        ],
      })),
      {
        name: "geopoint",
        type: "geopoint",
        label: "Location",
        required: false,
      },
    ],
  });
}

export function parseOdkSubmission(raw: unknown): OdkSubmission {
  return odkSubmissionSchema.parse(raw);
}

import { z } from "zod";

export const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "casual",
  "contract",
  "volunteer",
  "work_experience",
  "supported_employment",
]);

export const maxJobSkills = 12;
export const maxJobSkillLength = 160;

export const jobSkillsSchema = z
  .array(z.object({
    label: z.string().trim().min(1, "Enter a skill.").max(maxJobSkillLength, "Use up to 160 characters per skill."),
    isEssential: z.boolean(),
  }))
  .max(maxJobSkills, "List up to 12 skills in total.")
  .refine((skills) => {
    const labels = skills.map(({ label }) => label.toLowerCase().replace(/\s+/g, " "));
    return new Set(labels).size === labels.length;
  }, "List each skill once, in the group that best describes it.");

export type JobSkillInput = z.infer<typeof jobSkillsSchema>[number];

export const createJobSchema = z.object({
  employerOrganisationId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  employmentType: employmentTypeSchema,
  location: z.string().optional(),
  remoteAllowed: z.boolean().optional(),
  flexibleHours: z.boolean().optional(),
  payRange: z.string().optional(),
  accessibilityFeatures: z.record(z.string(), z.unknown()).optional(),
  adjustmentOpennessStatement: z.string().optional(),
  applicationInstructions: z.string().optional(),
  skills: jobSkillsSchema.optional(),
});

export const createJobApplicationSchema = z.object({
  jobId: z.string(),
  applicantSummary: z.string().optional(),
  coverLetter: z.string().optional(),
  reasonableAdjustmentRequest: z.string().optional(),
  shareAdjustments: z.boolean().optional(),
  shareAdjustmentsConfirmed: z.boolean().optional(),
  transportSupportNeeded: z.boolean().optional(),
  careSupportNeeded: z.boolean().optional(),
  resumeDocumentId: z.string().optional(),
});

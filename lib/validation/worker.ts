import { z } from "zod";

export const workerProfileSelfSchema = z.object({
  displayName: z.string().min(1).max(120),
  profileSummary: z.string().max(5000).optional().nullable(),
  serviceTypes: z.array(z.string().max(80)).max(30).optional(),
  serviceRegions: z.array(z.string().max(120)).max(30).optional(),
  specialisations: z.array(z.string().max(120)).max(30).optional(),
  languages: z.array(z.string().max(80)).max(20).optional(),
  communicationCapabilities: z.array(z.string().max(120)).max(20).optional(),
  qualificationsSummary: z.string().max(5000).optional().nullable(),
});

export const workerProfileOrgSchema = workerProfileSelfSchema.extend({
  active: z.boolean().optional(),
});

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().max(64).optional(),
  active: z.boolean().optional(),
});

export const availabilityWindowsPatchSchema = z.object({
  windows: z.array(availabilityWindowSchema).max(56),
});

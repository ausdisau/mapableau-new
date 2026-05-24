import { z } from "zod";

export const homeModificationRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  addressSummary: z.string().optional(),
  fundingNotes: z.string().optional(),
});

export const homeAccessIssueSchema = z.object({
  area: z.string().min(1),
  issueType: z.string().min(1),
  severity: z.enum(["low", "moderate", "high"]).optional(),
  description: z.string().optional(),
});

export const quoteRequestSchema = z.object({
  providerId: z.string().min(1),
  organisationId: z.string().optional(),
  title: z.string().min(1),
});

export const assessmentBookingSchema = z.object({
  assessorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
});

export const milestoneUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "blocked"]),
});

export const documentUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  storageKey: z.string().optional(),
  documentType: z.string().optional(),
});

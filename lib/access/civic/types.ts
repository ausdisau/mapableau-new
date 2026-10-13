import { z } from "zod";

/**
 * Civic access issue — draft-first; never auto-submitted to Open311.
 */

export const CIVIC_ISSUE_STATUSES = [
  "draft",
  "pending_confirmation",
  "submitted",
  "external_acknowledged",
  "external_resolved",
  "needs_community_verification",
  "closed",
] as const;
export type CivicIssueStatus = (typeof CIVIC_ISSUE_STATUSES)[number];

export const civicAccessIssueSchema = z
  .object({
    id: z.string().min(1),
    draftId: z.string().min(1),
    status: z.enum(CIVIC_ISSUE_STATUSES),
    serviceCode: z.string().min(1),
    description: z.string().min(1).max(4000),
    lat: z.number().optional(),
    lng: z.number().optional(),
    placeId: z.string().optional(),
    externalServiceRequestId: z.string().optional(),
    evidenceObjectIds: z.array(z.string()).default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
    submittedAt: z.string().optional(),
    resolvedAt: z.string().optional(),
    /** Human actor ref — never publish. */
    actorRef: z.string().min(1),
    confirmationToken: z.string().optional(),
  })
  .strict();

export type CivicAccessIssue = z.infer<typeof civicAccessIssueSchema>;

export const civicIssueDraftInputSchema = z
  .object({
    serviceCode: z.string().min(1),
    description: z.string().min(1).max(4000),
    lat: z.number().optional(),
    lng: z.number().optional(),
    placeId: z.string().optional(),
    evidenceObjectIds: z.array(z.string()).default([]),
    actorRef: z.string().min(1),
  })
  .strict();

export type CivicIssueDraftInput = z.infer<typeof civicIssueDraftInputSchema>;

export const civicSubmissionConfirmSchema = z
  .object({
    draftId: z.string().min(1),
    confirmationToken: z.string().min(8),
    actorRef: z.string().min(1),
    /** Explicit human confirmation — required for submit. */
    humanConfirmed: z.literal(true),
  })
  .strict();

export type CivicSubmissionConfirm = z.infer<typeof civicSubmissionConfirmSchema>;

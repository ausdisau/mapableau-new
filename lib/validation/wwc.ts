import { z } from "zod";

import {
  WWC_CHECK_TYPES_BY_JURISDICTION,
  WWC_JURISDICTIONS,
} from "@/types/wwc-verification";

const jurisdictionSchema = z.enum(
  WWC_JURISDICTIONS as [string, ...string[]]
);

export const wwcSubmitSchema = z
  .object({
    jurisdiction: jurisdictionSchema,
    checkType: z.string().min(1),
    checkNumber: z.string().min(3).max(50),
    legalFirstName: z.string().min(1).max(100),
    legalLastName: z.string().min(1).max(100),
    dateOfBirth: z.string().min(1).optional().nullable(),
    expiresAt: z.string().min(1).optional().nullable(),
    evidenceDocumentId: z.string().cuid().optional().nullable(),
    consentConfirmed: z
      .boolean()
      .refine((v) => v === true, "You must confirm consent to submit this check for review"),
  })
  .superRefine((data, ctx) => {
    const allowed =
      WWC_CHECK_TYPES_BY_JURISDICTION[
        data.jurisdiction as keyof typeof WWC_CHECK_TYPES_BY_JURISDICTION
      ];
    if (!allowed?.includes(data.checkType as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check type is not valid for the selected state or territory",
        path: ["checkType"],
      });
    }
  });

export const wwcEligibilityCheckSchema = z.object({
  participantUnder18: z.boolean().optional(),
  mapableKids: z.boolean().optional(),
  schoolTransport: z.boolean().optional(),
  paediatricTherapy: z.boolean().optional(),
  youthEmploymentSupport: z.boolean().optional(),
  safeguardingRestrictionActive: z.boolean().optional(),
  careRequestType: z.string().optional().nullable(),
  workerProfileId: z.string().cuid().optional(),
});

export const wwcAdminDecisionSchema = z.object({
  decision: z.enum([
    "approve",
    "reject",
    "needs_more_information",
    "not_required",
    "expired",
    "suspended",
    "barred",
  ]),
  reviewNotes: z.string().max(5000).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  nextCheckAt: z.string().datetime().optional().nullable(),
  verifiedName: z.string().max(200).optional(),
});

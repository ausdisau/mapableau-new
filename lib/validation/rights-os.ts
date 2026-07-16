import { z } from "zod";

const rightsDataOperationSchema = z.enum([
  "read",
  "disclose",
  "create_derived_data",
  "store",
  "update",
  "export",
  "contact",
]);

export const createDataUseRequestSchema = z.object({
  requestId: z.string().uuid().optional(),
  requester: z.object({
    actorId: z.string().min(1),
    actorType: z.string().min(1),
    organisationId: z.string().optional(),
    role: z.string().optional(),
  }),
  recipient: z.object({
    actorId: z.string().optional(),
    organisationId: z.string().optional(),
    serviceId: z.string().optional(),
    displayName: z.string().min(1),
  }),
  subjectUserId: z.string().min(1).optional(),
  purposeCode: z.string().min(1),
  requestedOperations: z.array(rightsDataOperationSchema).min(1),
  requestedFields: z.array(z.string()).default([]),
  sourceAssets: z.array(z.string()).default([]),
  context: z
    .object({
      missionId: z.string().optional(),
      proposalId: z.string().optional(),
      bookingId: z.string().optional(),
      employmentId: z.string().optional(),
      visitPlanId: z.string().optional(),
      emergencyContextId: z.string().optional(),
    })
    .default({}),
  requestedUntil: z.string().datetime().optional(),
  onwardSharingRequested: z.boolean().default(false),
  retentionRequested: z.string().optional(),
});

export const createDecisionRoomSchema = z.object({
  title: z.string().min(1),
  question: z.string().min(1),
  values: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .min(1),
});

export const recordDecisionSchema = z.object({
  participantWording: z.string().min(1),
  chosenOptionId: z.string().optional(),
  reflection: z.string().optional(),
});

export const createCapsuleSchema = z.object({
  purposeCode: z.string().min(1),
  disclosedFields: z.array(z.string()).min(1),
  recipientOrganisationId: z.string().optional(),
  presentationMethod: z
    .enum(["secure_link", "qr_code", "printable_card", "phone_verification"])
    .default("secure_link"),
  expiresInHours: z.number().int().min(1).max(720).default(4),
});

export const createRightsRequestSchema = z.object({
  requestType: z.enum([
    "access",
    "correction",
    "deletion",
    "export",
    "revocation",
    "restriction",
    "objection",
    "explanation",
    "recipient_disclosure_history",
    "complaint",
  ]),
  scope: z.record(z.string(), z.unknown()).default({}),
});

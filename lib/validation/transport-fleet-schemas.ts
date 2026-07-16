import { z } from "zod";

const verificationKindSchema = z.enum([
  "licence",
  "screening",
  "training",
  "registration",
  "insurance",
  "inspection",
  "access_equipment",
]);

const verificationStatusSchema = z.enum([
  "not_provided",
  "pending_review",
  "verified",
  "expired",
  "rejected",
]);

export const createTransportDriverSchema = z.object({
  displayName: z.string().min(1).max(200),
  userId: z.string().optional(),
  driverProfileId: z.string().optional(),
});

export const updateTransportDriverSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  active: z.boolean().optional(),
  userId: z.string().nullable().optional(),
});

export const createTransportVehicleSchema = z.object({
  displayName: z.string().min(1).max(200),
  registrationNumber: z.string().max(50).optional(),
  vehicleId: z.string().optional(),
});

export const updateTransportVehicleSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  registrationNumber: z.string().max(50).nullable().optional(),
  active: z.boolean().optional(),
});

export const upsertVerificationSchema = z.object({
  kind: verificationKindSchema,
  status: verificationStatusSchema,
  expiresAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const upsertDriverVerificationsSchema = z.object({
  verifications: z.array(upsertVerificationSchema).min(1),
});

export const upsertVehicleVerificationsSchema = z.object({
  verifications: z.array(upsertVerificationSchema).min(1),
});

export const upsertVehicleFeaturesSchema = z.object({
  wheelchairAccessible: z.boolean().optional(),
  rampAvailable: z.boolean().optional(),
  liftAvailable: z.boolean().optional(),
  hoistAvailable: z.boolean().optional(),
  assistanceAnimalFriendly: z.boolean().optional(),
});

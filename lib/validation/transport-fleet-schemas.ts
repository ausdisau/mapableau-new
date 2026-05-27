import { z } from "zod";

export const fleetVehicleFeaturesSchema = z.object({
  wheelchairAccessible: z.boolean().optional(),
  rampAvailable: z.boolean().optional(),
  liftAvailable: z.boolean().optional(),
  hoistAvailable: z.boolean().optional(),
  assistanceAnimalFriendly: z.boolean().optional(),
});

export const fleetVerificationPatchSchema = z.object({
  kind: z.enum([
    "licence",
    "screening",
    "training",
    "registration",
    "insurance",
    "inspection",
    "access_equipment",
  ]),
  status: z.enum([
    "not_provided",
    "pending_review",
    "verified",
    "expired",
    "rejected",
  ]),
  expiresAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createFleetVehicleSchema = z.object({
  displayName: z.string().min(1).max(200),
  registrationNumber: z.string().max(50).optional(),
  vehicleId: z.string().cuid().optional(),
  features: fleetVehicleFeaturesSchema.optional(),
});

export const updateFleetVehicleSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  registrationNumber: z.string().max(50).optional().nullable(),
  active: z.boolean().optional(),
  features: fleetVehicleFeaturesSchema.optional(),
});

export const createFleetDriverSchema = z.object({
  displayName: z.string().min(1).max(200),
  userId: z.string().cuid().optional(),
  driverProfileId: z.string().cuid().optional(),
});

export const updateFleetDriverSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  userId: z.string().cuid().optional().nullable(),
  driverProfileId: z.string().cuid().optional().nullable(),
  active: z.boolean().optional(),
});

export const patchFleetVerificationsSchema = z.object({
  verifications: z.array(fleetVerificationPatchSchema).min(1),
});

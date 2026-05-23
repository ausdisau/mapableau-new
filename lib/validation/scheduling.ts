import { z } from "zod";

export const schedulingRequestSchema = z.object({
  serviceType: z.enum(["care", "transport", "care_transport"]),
  organisationId: z.string().optional(),
  requestedStart: z.string().datetime(),
  requestedEnd: z.string().datetime().optional(),
  pickupLocationId: z.string().optional(),
  dropoffLocationId: z.string().optional(),
  accessibilityRequirements: z.record(z.string(), z.unknown()).optional(),
  participantNotes: z.string().max(2000).optional(),
  title: z.string().max(200).optional(),
});

export const participantLocationSchema = z.object({
  label: z.string().min(1).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  suburb: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  isDefaultPickup: z.boolean().optional(),
});

export const serviceSiteSchema = z.object({
  name: z.string().min(1).max(200),
  addressPublic: z.string().max(500).optional(),
  suburb: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postcode: z.string().max(10).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

export const scheduleAssignSchema = z.object({
  resourceType: z.enum(["worker", "driver", "vehicle"]),
  resourceId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

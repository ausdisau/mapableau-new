import { z } from "zod";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const routeOptionsSchema = z.object({
  avoid: z.array(z.string().min(1).max(40)).max(8).optional(),
  routeType: z.enum(["fast", "short", "efficient"]).optional(),
  trafficMode: z.enum(["live", "historical", "none"]).optional(),
  maxAlternatives: z.number().int().min(0).max(2).optional(),
});

export const routeEstimateSchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  waypoints: z.array(latLngSchema).max(20).optional(),
  tripId: z.string().optional(),
  departAt: z.string().datetime().optional(),
  routeOptions: routeOptionsSchema.optional(),
  includeGeometry: z.boolean().optional(),
});

export const routeMatrixSchema = z.object({
  sources: z.array(latLngSchema).min(1),
  destinations: z.array(latLngSchema).min(1),
});

export const routeOptimiseSchema = z.object({
  tripId: z.string().optional(),
  stops: z.array(latLngSchema).min(2),
  organisationId: z.string().optional(),
});

export const routeCacheRefreshSchema = z.object({
  cacheKey: z.string().optional(),
  tripId: z.string().optional(),
});

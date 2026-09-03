import { z } from "zod";

/** Minimal Open311 service discovery stub — not a full city API mirror. */

export const open311ServiceSchema = z
  .object({
    service_code: z.string(),
    service_name: z.string(),
    description: z.string().optional(),
    metadata: z.boolean().optional(),
    type: z.string().optional(),
    keywords: z.string().optional(),
  })
  .passthrough();

export const open311ServiceDiscoverySchema = z
  .object({
    services: z.array(open311ServiceSchema).default([]),
  })
  .passthrough();

export const open311ServiceRequestSchema = z
  .object({
    service_code: z.string(),
    description: z.string().min(1).max(4000),
    lat: z.number().optional(),
    long: z.number().optional(),
    media: z.array(z.string()).optional(),
  })
  .strict();

export const open311SubmitResponseSchema = z
  .object({
    service_request_id: z.union([z.string(), z.number()]).optional(),
    token: z.string().optional(),
  })
  .passthrough();

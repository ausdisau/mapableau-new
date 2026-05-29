import { z } from "zod";

export const affiliateWorkerSchema = z
  .object({
    userId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    displayName: z.string().min(1).max(200).optional(),
    profileSummary: z.string().max(5000).optional(),
  })
  .refine((d) => d.userId || d.email, {
    message: "userId or email is required",
  });

export type AffiliateWorkerInput = z.infer<typeof affiliateWorkerSchema>;

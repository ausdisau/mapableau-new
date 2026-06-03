import { z } from "zod";

export const uberDispatchSchema = z.object({
  productId: z.string().min(1).optional(),
  fareId: z.string().min(1).optional(),
});

export const uberRequestIdQuerySchema = z.object({
  requestId: z.string().min(1, "requestId is required"),
});

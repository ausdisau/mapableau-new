import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  accountType: z.enum(["participant", "support_worker"]).default("participant"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

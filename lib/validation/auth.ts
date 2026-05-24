import { z } from "zod";

export const returnToSchema = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
    message: "returnTo must be a relative path",
  });

export const linkIdentitySchema = z.object({
  auth0UserId: z.string().min(1),
  provider: z.string().min(1),
  email: z.string().email().optional(),
  confirm: z.literal(true),
});

export const unlinkIdentitySchema = z.object({
  linkId: z.string().min(1),
});

export const onboardingRoleSchema = z.object({
  role: z.enum([
    "participant",
    "family_member",
    "support_coordinator",
    "plan_manager",
    "provider_admin",
    "support_worker",
    "driver",
    "transport_operator",
    "employer",
    "mapable_admin",
  ]),
});

export const accountLinkConfirmSchema = z.object({
  profileId: z.string().min(1),
  confirm: z.literal(true),
});

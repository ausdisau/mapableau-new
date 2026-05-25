import { z } from "zod";

const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  XERO_CLIENT_ID: z.string().min(1).optional(),
  XERO_CLIENT_SECRET: z.string().min(1).optional(),
  XERO_REDIRECT_URI: z.string().url().optional(),
  XERO_WEBHOOK_KEY: z.string().optional(),
  BILLING_ENCRYPTION_KEY: z.string().min(16).optional(),
});

export type BillingEnv = z.infer<typeof billingEnvSchema>;

export function getBillingEnv(): BillingEnv {
  return billingEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    XERO_CLIENT_ID: process.env.XERO_CLIENT_ID,
    XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET,
    XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI,
    XERO_WEBHOOK_KEY: process.env.XERO_WEBHOOK_KEY,
    BILLING_ENCRYPTION_KEY: process.env.BILLING_ENCRYPTION_KEY,
  });
}

export function requireStripeEnv() {
  const env = getBillingEnv();
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY_REQUIRED");
  return env as BillingEnv & { STRIPE_SECRET_KEY: string };
}

export function requireXeroEnv() {
  const env = getBillingEnv();
  if (!env.XERO_CLIENT_ID || !env.XERO_CLIENT_SECRET || !env.XERO_REDIRECT_URI) {
    throw new Error("XERO_ENV_INCOMPLETE");
  }
  return env as BillingEnv & {
    XERO_CLIENT_ID: string;
    XERO_CLIENT_SECRET: string;
    XERO_REDIRECT_URI: string;
  };
}

export function isStripePublishableConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

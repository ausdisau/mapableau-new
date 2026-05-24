import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  APP_BASE_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  NDIS_ADAPTER_TYPE: z
    .enum(["mock", "aggregator", "direct_ndia"])
    .default("mock"),
  PASSKEYS_ENABLED: z.string().optional(),
  ENTERPRISE_SSO_ENABLED: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export function validateProductionEnv(): { ok: boolean; missing: string[] } {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const;
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }
  return { ok: missing.length === 0, missing };
}

export function safeEnvSummary(): Record<string, string> {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    NDIS_ADAPTER_TYPE: process.env.NDIS_ADAPTER_TYPE ?? "mock",
    STRIPE_CONFIGURED: process.env.STRIPE_SECRET_KEY ? "yes" : "no",
    PASSKEYS_ENABLED: process.env.PASSKEYS_ENABLED ?? "false",
  };
}

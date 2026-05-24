import { z } from "zod";

const authEnvSchema = z
  .object({
    AUTH0_SECRET: z.string().min(32).optional(),
    AUTH0_BASE_URL: z.string().url().optional(),
    AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
    AUTH0_DOMAIN: z.string().min(1).optional(),
    AUTH0_CLIENT_ID: z.string().min(1).optional(),
    AUTH0_CLIENT_SECRET: z.string().min(1).optional(),
    AUTH0_AUDIENCE: z.string().optional(),
    AUTH0_SCOPE: z.string().default("openid profile email"),
    APP_BASE_URL: z.string().url().optional(),
    ENABLE_WIX_MEMBER_BRIDGE: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    WIX_API_KEY: z.string().optional(),
    WIX_SITE_ID: z.string().optional(),
    WIX_ACCOUNT_ID: z.string().optional(),
    AUTH_ENABLE_LEGACY_CREDENTIALS: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v !== "false"),
  })
  .superRefine((env, ctx) => {
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) return;

    const required = [
      "AUTH0_SECRET",
      "AUTH0_CLIENT_ID",
      "AUTH0_CLIENT_SECRET",
      "APP_BASE_URL",
    ] as const;

    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          message: `${key} is required in production`,
          path: [key],
        });
      }
    }

    if (!env.AUTH0_ISSUER_BASE_URL && !env.AUTH0_DOMAIN) {
      ctx.addIssue({
        code: "custom",
        message: "AUTH0_ISSUER_BASE_URL or AUTH0_DOMAIN is required in production",
        path: ["AUTH0_ISSUER_BASE_URL"],
      });
    }

    if (env.ENABLE_WIX_MEMBER_BRIDGE) {
      for (const key of ["WIX_API_KEY", "WIX_SITE_ID"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            message: `${key} is required when ENABLE_WIX_MEMBER_BRIDGE=true`,
            path: [key],
          });
        }
      }
    }
  });

export type AuthEnv = z.infer<typeof authEnvSchema>;

let cached: AuthEnv | null = null;

export function getAuthEnv(): AuthEnv {
  if (cached) return cached;

  cached = authEnvSchema.parse({
    AUTH0_SECRET: process.env.AUTH0_SECRET,
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    AUTH0_SCOPE: process.env.AUTH0_SCOPE ?? "openid profile email",
    APP_BASE_URL: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL,
    ENABLE_WIX_MEMBER_BRIDGE: process.env.ENABLE_WIX_MEMBER_BRIDGE,
    WIX_API_KEY: process.env.WIX_API_KEY,
    WIX_SITE_ID: process.env.WIX_SITE_ID,
    WIX_ACCOUNT_ID: process.env.WIX_ACCOUNT_ID,
    AUTH_ENABLE_LEGACY_CREDENTIALS: process.env.AUTH_ENABLE_LEGACY_CREDENTIALS,
  });

  return cached;
}

export function getAuth0Issuer(): string {
  const env = getAuthEnv();
  if (env.AUTH0_ISSUER_BASE_URL) return env.AUTH0_ISSUER_BASE_URL;
  if (env.AUTH0_DOMAIN) {
    const domain = env.AUTH0_DOMAIN.replace(/^https?:\/\//, "");
    return `https://${domain}`;
  }
  return "https://login.ad.org.au";
}

export function isAuth0Configured(): boolean {
  const env = getAuthEnv();
  return Boolean(
    env.AUTH0_CLIENT_ID &&
      env.AUTH0_CLIENT_SECRET &&
      env.AUTH0_SECRET &&
      (env.AUTH0_ISSUER_BASE_URL || env.AUTH0_DOMAIN),
  );
}

export function getWixLoginUrl(returnTo = "/dashboard"): string {
  const base = getAuthEnv().APP_BASE_URL ?? "https://app.mapable.com.au";
  return `${base}/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function getWixRegisterUrl(): string {
  const base = getAuthEnv().APP_BASE_URL ?? "https://app.mapable.com.au";
  return `${base}/register`;
}

import { getAppleClientSecret } from "@/lib/auth/apple-client-secret";

export type OAuthProviderFlags = {
  auth0: boolean;
  google: boolean;
  microsoft: boolean;
  facebook: boolean;
  apple: boolean;
};

export type SupabaseOAuthProviderId =
  | "google"
  | "azure"
  | "facebook"
  | "apple";

function auth0ClientId(): string | undefined {
  return process.env.AUTH0_CLIENT_ID?.trim() || undefined;
}

function auth0ClientSecret(): string | undefined {
  return process.env.AUTH0_CLIENT_SECRET?.trim() || undefined;
}

function auth0Issuer(): string | undefined {
  return (
    process.env.AUTH0_ISSUER_BASE_URL?.trim() ||
    process.env.AUTH0_ISSUER?.trim() ||
    undefined
  );
}

function googleClientId(): string | undefined {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_ID?.trim() ||
    process.env.AUTH_GOOGLE_ID?.trim() ||
    undefined
  );
}

function googleClientSecret(): string | undefined {
  return (
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_SECRET?.trim() ||
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    undefined
  );
}

function facebookClientId(): string | undefined {
  return (
    process.env.FACEBOOK_CLIENT_ID?.trim() ||
    process.env.FACEBOOK_APP_ID?.trim() ||
    undefined
  );
}

function facebookClientSecret(): string | undefined {
  return (
    process.env.FACEBOOK_CLIENT_SECRET?.trim() ||
    process.env.FACEBOOK_APP_SECRET?.trim() ||
    undefined
  );
}

function envPresent(...keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

function appleClientId(): string | undefined {
  return (
    process.env.APPLE_ID?.trim() ||
    process.env.APPLE_CLIENT_ID?.trim() ||
    undefined
  );
}

function appleCredentialsPresent(): boolean {
  const id = appleClientId();
  if (!id) return false;
  if (process.env.APPLE_SECRET?.trim()) return true;
  return Boolean(
    process.env.APPLE_TEAM_ID?.trim() &&
      process.env.APPLE_KEY_ID?.trim() &&
      process.env.APPLE_PRIVATE_KEY?.trim(),
  );
}

/**
 * OAuth buttons are shown when providers are enabled in Supabase Auth.
 * Env vars remain as feature flags for which buttons to render.
 */
export function getConfiguredOAuthProviders(): OAuthProviderFlags {
  return {
    auth0: Boolean(auth0ClientId() && auth0ClientSecret() && auth0Issuer()),
    google: Boolean(googleClientId() && googleClientSecret()),
    microsoft: envPresent("AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET"),
    facebook: Boolean(facebookClientId() && facebookClientSecret()),
    apple: appleCredentialsPresent(),
  };
}

/** Maps UI provider keys to Supabase Auth provider ids. */
export function getSupabaseOAuthProviderIds(): SupabaseOAuthProviderId[] {
  const flags = getConfiguredOAuthProviders();
  const providers: SupabaseOAuthProviderId[] = [];

  if (flags.google) providers.push("google");
  if (flags.microsoft) providers.push("azure");
  if (flags.facebook) providers.push("facebook");
  if (flags.apple && appleClientId() && getAppleClientSecret(appleClientId()!)) {
    providers.push("apple");
  }

  return providers;
}

/** @deprecated NextAuth providers removed — OAuth runs through Supabase Auth. */
export function buildOAuthProviders(): Array<{ id: string }> {
  const flags = getConfiguredOAuthProviders();
  const providers: Array<{ id: string }> = [];

  if (flags.auth0) providers.push({ id: "auth0" });
  if (flags.google) providers.push({ id: "google" });
  if (flags.microsoft) providers.push({ id: "azure-ad" });
  if (flags.facebook) providers.push({ id: "facebook" });
  if (flags.apple) providers.push({ id: "apple" });

  return providers;
}

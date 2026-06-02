import Auth0Provider from "next-auth/providers/auth0";
import AzureADProvider from "next-auth/providers/azure-ad";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";

export type OAuthProviderFlags = {
  auth0: boolean;
  google: boolean;
  microsoft: boolean;
  facebook: boolean;
};

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

export function getConfiguredOAuthProviders(): OAuthProviderFlags {
  return {
    auth0: Boolean(auth0ClientId() && auth0ClientSecret() && auth0Issuer()),
    google: Boolean(googleClientId() && googleClientSecret()),
    microsoft: envPresent("AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET"),
    facebook: Boolean(facebookClientId() && facebookClientSecret()),
  };
}

/** NextAuth OAuth providers — only registered when env credentials are set. */
export function buildOAuthProviders(): Provider[] {
  const providers: Provider[] = [];
  const flags = getConfiguredOAuthProviders();

  if (flags.auth0) {
    providers.push(
      Auth0Provider({
        clientId: auth0ClientId()!,
        clientSecret: auth0ClientSecret()!,
        issuer: auth0Issuer()!.replace(/\/$/, ""),
      }),
    );
  }

  if (flags.google) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId()!,
        clientSecret: googleClientSecret()!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    );
  }

  if (flags.microsoft) {
    const tenantId = process.env.AZURE_AD_TENANT_ID?.trim() || "common";

    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!.trim(),
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!.trim(),
        tenantId,
      }),
    );
  }

  if (flags.facebook) {
    providers.push(
      FacebookProvider({
        clientId: facebookClientId()!,
        clientSecret: facebookClientSecret()!,
      }),
    );
  }

  return providers;
}

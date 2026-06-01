import type { Provider } from "next-auth/providers/index";
import AzureADProvider from "next-auth/providers/azure-ad";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export type OAuthProviderFlags = {
  google: boolean;
  microsoft: boolean;
  facebook: boolean;
};

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
    google: envPresent("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
    microsoft: envPresent("AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET"),
    facebook: Boolean(facebookClientId() && facebookClientSecret()),
  };
}

/** NextAuth OAuth providers — only registered when env credentials are set. */
export function buildOAuthProviders(): Provider[] {
  const providers: Provider[] = [];
  const flags = getConfiguredOAuthProviders();

  if (flags.google) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      })
    );
  }

  if (flags.microsoft) {
    const tenantId =
      process.env.AZURE_AD_TENANT_ID?.trim() || "common";

    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!.trim(),
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!.trim(),
        tenantId,
      })
    );
  }

  if (flags.facebook) {
    providers.push(
      FacebookProvider({
        clientId: facebookClientId()!,
        clientSecret: facebookClientSecret()!,
      })
    );
  }

  return providers;
}

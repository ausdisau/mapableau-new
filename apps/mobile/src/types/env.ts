
import Constants from "expo-constants";
import { assertNoClientSecret } from "@mapable/auth-client";

export type MobilePublicEnv = {
  apiBaseUrl: string;
  oauthClientId: string;
  oauthIssuer: string;
  appVersion: string;
};

export function loadMobilePublicEnv(): MobilePublicEnv {
  assertNoClientSecret(process.env as Record<string, string | undefined>);
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return {
    apiBaseUrl: String(extra.mapableApiBaseUrl ?? process.env.EXPO_PUBLIC_MAPABLE_API_BASE_URL ?? ""),
    oauthClientId: String(extra.oauthClientId ?? process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? ""),
    oauthIssuer: String(extra.oauthIssuer ?? process.env.EXPO_PUBLIC_OAUTH_ISSUER ?? ""),
    appVersion: String(extra.appVersion ?? "0.1.0"),
  };
}

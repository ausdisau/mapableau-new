import { isAuth0ProviderConfigured } from "@/lib/auth/auth0-config";

export type Auth0SocialProvider = "google" | "facebook" | "microsoft";

export type Auth0SocialConnection = {
  id: Auth0SocialProvider;
  label: string;
  /** Auth0 connection name passed as `connection` authorization param. */
  connection: string;
};

/** Auth0 dashboard connection names (override per env if renamed). */
const DEFAULT_CONNECTION: Record<Auth0SocialProvider, string> = {
  google: "google-oauth2",
  facebook: "facebook",
  microsoft: "windowslive",
};

const ENV_CONNECTION: Record<Auth0SocialProvider, string> = {
  google: "AUTH0_GOOGLE_CONNECTION",
  facebook: "AUTH0_FACEBOOK_CONNECTION",
  microsoft: "AUTH0_MICROSOFT_CONNECTION",
};

const ENV_ENABLED: Record<Auth0SocialProvider, string> = {
  google: "AUTH0_SOCIAL_GOOGLE_ENABLED",
  facebook: "AUTH0_SOCIAL_FACEBOOK_ENABLED",
  microsoft: "AUTH0_SOCIAL_MICROSOFT_ENABLED",
};

const LABELS: Record<Auth0SocialProvider, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
  microsoft: "Continue with Microsoft",
};

function connectionNameFor(provider: Auth0SocialProvider): string {
  const fromEnv = process.env[ENV_CONNECTION[provider]]?.trim();
  return fromEnv || DEFAULT_CONNECTION[provider];
}

function isProviderEnabled(provider: Auth0SocialProvider): boolean {
  const flag = process.env[ENV_ENABLED[provider]]?.trim();
  if (flag === "false") return false;
  return true;
}

/** Social IdPs to show on login when Auth0 is configured. */
export function getAuth0SocialConnections(): Auth0SocialConnection[] {
  if (!isAuth0ProviderConfigured()) return [];

  const order: Auth0SocialProvider[] = ["google", "microsoft", "facebook"];

  return order
    .filter(isProviderEnabled)
    .map((id) => ({
      id,
      label: LABELS[id],
      connection: connectionNameFor(id),
    }));
}

import type { TokenSet } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";

export const WORKOS_AUTHKIT_PROVIDER_ID = "workos-authkit";
const WORKOS_API_BASE_URL = "https://api.workos.com";

export type WorkOSAuthKitProfile = {
  object: "user";
  id: string;
  email: string;
  email_verified: boolean;
  profile_picture_url: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  locale: string | null;
};

type WorkOSAuthenticationResponse = {
  user: WorkOSAuthKitProfile;
  access_token: string;
  refresh_token: string;
  organization_id?: string;
};

type WorkOSTokenMetadata = {
  workos_profile: WorkOSAuthKitProfile;
  workos_organization_id?: string;
};

export type WorkOSRefreshResult = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number | null;
};

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function workOSClientId(): string | undefined {
  return process.env.WORKOS_CLIENT_ID?.trim() || undefined;
}

function workOSApiKey(): string | undefined {
  return process.env.WORKOS_API_KEY?.trim() || undefined;
}

export function isWorkOSAuthKitConfigured(): boolean {
  return Boolean(
    enabled(process.env.WORKOS_AUTHKIT_ENABLED) &&
      workOSClientId() &&
      workOSApiKey(),
  );
}

function workOSApiBaseUrl(): string {
  return (
    process.env.WORKOS_API_BASE_URL?.trim() || WORKOS_API_BASE_URL
  ).replace(/\/$/, "");
}

function isWorkOSProfile(value: unknown): value is WorkOSAuthKitProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return (
    profile.object === "user" &&
    typeof profile.id === "string" &&
    profile.id.length > 0 &&
    typeof profile.email === "string" &&
    profile.email.length > 0 &&
    typeof profile.email_verified === "boolean"
  );
}

function parseAuthenticationResponse(
  value: unknown,
): WorkOSAuthenticationResponse {
  if (!value || typeof value !== "object") {
    throw new Error("WorkOS AuthKit returned an invalid response.");
  }

  const response = value as Record<string, unknown>;
  if (
    !isWorkOSProfile(response.user) ||
    typeof response.access_token !== "string" ||
    !response.access_token ||
    typeof response.refresh_token !== "string" ||
    !response.refresh_token
  ) {
    throw new Error("WorkOS AuthKit returned an incomplete response.");
  }

  return response as WorkOSAuthenticationResponse;
}

async function authenticateWithWorkOS(
  body: Record<string, string>,
): Promise<WorkOSAuthenticationResponse> {
  const apiKey = workOSApiKey();
  if (!apiKey) throw new Error("WorkOS AuthKit is not configured.");
  const response = await fetch(
    `${workOSApiBaseUrl()}/user_management/authenticate`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `WorkOS AuthKit authentication failed with status ${response.status}.`,
    );
  }

  return parseAuthenticationResponse(await response.json());
}

/** Read only the expiry from a WorkOS JWT. This does not verify or authorize it. */
export function workOSAccessTokenExpiresAt(
  accessToken: string,
): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp * 1_000 : null;
  } catch {
    return null;
  }
}

export async function refreshWorkOSAuthKitToken(
  refreshToken: string,
): Promise<WorkOSRefreshResult> {
  const clientId = workOSClientId();
  const apiKey = workOSApiKey();
  if (!clientId || !apiKey) {
    throw new Error("WorkOS AuthKit is not configured.");
  }

  const response = await authenticateWithWorkOS({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: apiKey,
  });

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: workOSAccessTokenExpiresAt(response.access_token),
  };
}

/**
 * WorkOS AuthKit hosted sign-in adapted to MapAble's established NextAuth
 * session. PKCE and state are both required; application roles still come
 * exclusively from Prisma.
 */
export function buildWorkOSAuthKitProvider(): OAuthConfig<WorkOSAuthKitProfile> {
  const clientId = workOSClientId();
  const apiKey = workOSApiKey();
  if (!clientId || !apiKey) {
    throw new Error("WorkOS AuthKit is not configured.");
  }

  const apiBaseUrl = workOSApiBaseUrl();

  return {
    id: WORKOS_AUTHKIT_PROVIDER_ID,
    name: "MapAble secure sign-in",
    type: "oauth",
    clientId,
    clientSecret: apiKey,
    checks: ["pkce", "state"],
    authorization: {
      url: `${apiBaseUrl}/user_management/authorize`,
      params: {
        provider: "authkit",
        response_type: "code",
      },
    },
    token: {
      url: `${apiBaseUrl}/user_management/authenticate`,
      async request({ params, checks }) {
        if (typeof params.code !== "string" || !params.code) {
          throw new Error("WorkOS AuthKit callback did not include a code.");
        }
        if (typeof checks.code_verifier !== "string" || !checks.code_verifier) {
          throw new Error("WorkOS AuthKit PKCE verification is missing.");
        }

        const response = await authenticateWithWorkOS({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: apiKey,
          code: params.code,
          code_verifier: checks.code_verifier,
        });
        const expiresAt = workOSAccessTokenExpiresAt(response.access_token);

        const tokens: TokenSet & WorkOSTokenMetadata = {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          token_type: "Bearer",
          ...(expiresAt ? { expires_at: Math.floor(expiresAt / 1_000) } : {}),
          workos_profile: response.user,
          workos_organization_id: response.organization_id,
        };
        return { tokens };
      },
    },
    userinfo: {
      async request({ tokens }) {
        const profile = (tokens as unknown as Record<string, unknown>)
          .workos_profile;
        if (!isWorkOSProfile(profile)) {
          throw new Error("WorkOS AuthKit profile is missing.");
        }
        return profile;
      },
    },
    profile(profile) {
      const fullName =
        profile.name?.trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        null;
      return {
        id: profile.id,
        email: profile.email,
        name: fullName,
        image: profile.profile_picture_url,
      };
    },
    style: {
      logo: "/brand/mapable-logo-mark.svg",
      bg: "#ffffff",
      text: "#0b3a66",
    },
  };
}

import { uberConfig } from "@/lib/uber/config";
import { UberApiError } from "@/lib/uber/errors";

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

let cached: TokenCache | null = null;

const EXPIRY_BUFFER_MS = 60_000;

export function clearUberTokenCache(): void {
  cached = null;
}

export async function getUberAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAtMs - EXPIRY_BUFFER_MS) {
    return cached.accessToken;
  }

  const clientId = uberConfig.clientId;
  const clientSecret = uberConfig.clientSecret;
  if (!clientId || !clientSecret) {
    throw new UberApiError("Uber OAuth credentials are not configured", 503, "UBER_NOT_CONFIGURED");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: uberConfig.oauthScope,
  });

  const res = await fetch(uberConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !payload.access_token) {
    throw new UberApiError(
      payload.error_description ?? payload.error ?? "Uber OAuth token request failed",
      res.status,
      payload.error,
      payload
    );
  }

  const expiresInSec = payload.expires_in ?? 3600;
  cached = {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };

  return cached.accessToken;
}

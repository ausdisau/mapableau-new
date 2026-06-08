import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";

import {
  getNdiaHttpConfig,
  isNdiaLiveSubmitAllowed,
} from "./config";
import { classifyNdiaHttpError, NdiaApiError } from "./ndia-errors";
import { logNdiaEvent } from "./ndia-logger";
import {
  mapNdiaStatusResponse,
  mapNdiaSubmitResponse,
  mapProviderClaimToNdiaRequest,
} from "./ndia-payload-mapper";

export type NdiaSubmitResult = {
  mode: "mock" | "http";
  externalClaimId: string;
  externalStatus: string;
  response?: unknown;
  requestBody?: Record<string, unknown>;
};

export type NdiaStatusResult = {
  mode: "mock" | "http";
  status: string;
  response?: unknown;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function apiUrl(path: string): string {
  const config = getNdiaHttpConfig();
  return `${config.apiBaseUrl.replace(/\/$/, "")}${path}`;
}

function statusPath(externalClaimId: string): string {
  const config = getNdiaHttpConfig();
  return config.claimStatusPath.replace(
    "{claimId}",
    encodeURIComponent(externalClaimId)
  );
}

export async function fetchNdiaAccessToken(): Promise<string> {
  const config = getNdiaHttpConfig();
  if (!config.tokenUrl) {
    throw new NdiaApiError(
      "NDIA_PROVIDER_TOKEN_URL not configured",
      "auth"
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  logNdiaEvent("token.fetch.start");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.apiClientId,
    client_secret: config.apiClientSecret,
  });

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    logNdiaEvent("token.fetch.error", { httpStatus: res.status }, "error");
    throw classifyNdiaHttpError(res.status, json, "NDIA token request failed");
  }

  const record = json as { access_token: string; expires_in?: number };
  cachedToken = {
    token: record.access_token,
    expiresAt: now + (record.expires_in ?? 3600) * 1000 - 60_000,
  };

  logNdiaEvent("token.fetch.success");
  return cachedToken.token;
}

export async function probeNdiaConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isNdiaLiveSubmitAllowed()) {
    return {
      ok: true,
      message: "Live submit disabled — mock adapter active",
    };
  }

  const config = getNdiaHttpConfig();
  if (!config.tokenUrl || !config.apiClientId) {
    return { ok: false, message: "NDIA OAuth credentials incomplete" };
  }

  try {
    await fetchNdiaAccessToken();
    return { ok: true, message: "NDIA OAuth token acquired" };
  } catch (e) {
    const msg = e instanceof NdiaApiError ? e.toUserMessage() : "Token probe failed";
    return { ok: false, message: msg };
  }
}

export async function submitNdiaClaimBody(
  requestBody: Record<string, unknown>
): Promise<NdiaSubmitResult> {
  if (!isNdiaLiveSubmitAllowed()) {
    const mockId = `ndia_mock_${Date.now()}`;
    logNdiaEvent("claim.submit.mock", {
      lineCount: Array.isArray(requestBody.lineItems)
        ? requestBody.lineItems.length
        : undefined,
    });
    return {
      mode: "mock",
      externalClaimId: mockId,
      externalStatus: "submitted_mock",
      requestBody,
      response: {
        message:
          "Mock submission — configure NDIA_PROVIDER_API_* and NDIA_REAL_SUBMISSION_ENABLED for live API.",
      },
    };
  }

  const config = getNdiaHttpConfig();
  const token = await fetchNdiaAccessToken();
  const url = apiUrl(config.claimSubmitPath);

  logNdiaEvent("claim.submit.start", { submitPath: config.claimSubmitPath });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    logNdiaEvent("claim.submit.error", { httpStatus: res.status }, "error");
    throw classifyNdiaHttpError(res.status, json, "NDIA claim submit failed");
  }

  const mapped = mapNdiaSubmitResponse(json);
  logNdiaEvent("claim.submit.success", {
    externalClaimId: mapped.externalClaimId,
    externalStatus: mapped.externalStatus,
  });

  return {
    mode: "http",
    externalClaimId: mapped.externalClaimId,
    externalStatus: mapped.externalStatus,
    requestBody,
    response: mapped.raw,
  };
}

export async function submitProviderClaimPayload(
  payload: NdiaProviderClaimPayload
): Promise<NdiaSubmitResult> {
  const requestBody = mapProviderClaimToNdiaRequest(payload);
  return submitNdiaClaimBody(requestBody);
}

export async function getNdiaClaimStatus(
  externalClaimId: string
): Promise<NdiaStatusResult> {
  if (!isNdiaLiveSubmitAllowed()) {
    return {
      mode: "mock",
      status: "submitted_mock",
      response: { message: "Status polling requires live NDIA API" },
    };
  }

  const config = getNdiaHttpConfig();
  if (!config.claimStatusPollEnabled) {
    throw new NdiaApiError(
      "NDIA claim status polling disabled",
      "validation"
    );
  }

  const token = await fetchNdiaAccessToken();
  const url = apiUrl(statusPath(externalClaimId));

  logNdiaEvent("claim.status.start", { externalClaimId });

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    logNdiaEvent("claim.status.error", { httpStatus: res.status }, "error");
    throw classifyNdiaHttpError(res.status, json, "NDIA claim status failed");
  }

  const mapped = mapNdiaStatusResponse(json);
  logNdiaEvent("claim.status.success", {
    externalClaimId,
    status: mapped.status,
  });

  return { mode: "http", status: mapped.status, response: mapped.raw };
}

/** Test helper — reset cached OAuth token between tests. */
export function resetNdiaTokenCacheForTests() {
  cachedToken = null;
}

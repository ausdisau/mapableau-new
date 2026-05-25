import { requireXeroEnv } from "@/lib/config/billing-env";

const XERO_IDENTITY = "https://identity.xero.com";
const XERO_API = "https://api.xero.com";

export function getXeroOAuthAuthorizeUrl(state: string): string {
  const env = requireXeroEnv();
  const scopes = [
    "openid",
    "profile",
    "email",
    "accounting.settings",
    "accounting.transactions",
    "offline_access",
  ].join(" ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.XERO_CLIENT_ID,
    redirect_uri: env.XERO_REDIRECT_URI,
    scope: scopes,
    state,
  });
  return `${XERO_IDENTITY}/connect/authorize?${params}`;
}

export async function exchangeXeroCode(code: string) {
  const env = requireXeroEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.XERO_REDIRECT_URI,
  });
  const auth = Buffer.from(
    `${env.XERO_CLIENT_ID}:${env.XERO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${XERO_IDENTITY}/connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error("XERO_TOKEN_EXCHANGE_FAILED");
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope?: string;
  };
}

export async function refreshXeroToken(refreshToken: string) {
  const env = requireXeroEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const auth = Buffer.from(
    `${env.XERO_CLIENT_ID}:${env.XERO_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${XERO_IDENTITY}/connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error("XERO_REFRESH_FAILED");
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export async function fetchXeroConnections(accessToken: string) {
  const res = await fetch(`${XERO_API}/connections`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("XERO_CONNECTIONS_FAILED");
  return (await res.json()) as Array<{
    tenantId: string;
    tenantName?: string;
  }>;
}

export async function createXeroInvoice(
  accessToken: string,
  tenantId: string,
  payload: object
) {
  const res = await fetch(`${XERO_API}/api.xro/2.0/Invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Xero-Tenant-Id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ Invoices: [payload] }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data && "Message" in data
        ? String((data as { Message: string }).Message)
        : "XERO_INVOICE_CREATE_FAILED"
    );
  }
  return data as {
    Invoices: Array<{ InvoiceID: string }>;
  };
}

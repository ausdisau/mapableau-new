/**
 * Deputy install hostnames must match `{install}.{geo}.deputy.com`.
 * Never accept arbitrary user-supplied API hosts (SSRF).
 */

const DEPUTY_HOST_RE =
  /^[a-z0-9][a-z0-9-]{0,62}\.(au|eu|uk|us)\.deputy\.com$/i;

export function isAllowedDeputyHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return DEPUTY_HOST_RE.test(host);
}

export function parseDeputyEndpoint(endpoint: string): {
  hostname: string;
  baseUrl: string;
} {
  const raw = endpoint.trim().toLowerCase().replace(/^https?:\/\//, "");
  const hostname = raw.split("/")[0] ?? "";
  if (!isAllowedDeputyHostname(hostname)) {
    throw new Error(
      `Deputy endpoint hostname is not allowed: ${hostname || "(empty)"}`,
    );
  }
  return { hostname, baseUrl: `https://${hostname}` };
}

export const DEPUTY_ONCE_BASE = "https://once.deputy.com";

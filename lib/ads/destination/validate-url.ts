/**
 * Destination URL safety for advertising creatives and click redirects.
 */

const BLOCKED_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
]);

export type DestinationValidation =
  | { ok: true; url: URL; href: string }
  | { ok: false; reason: string };

export function validateAdDestination(
  raw: string,
  options: { requireHttps?: boolean } = {},
): DestinationValidation {
  const requireHttps = options.requireHttps ?? process.env.NODE_ENV === "production";
  const trimmed = raw?.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const lower = trimmed.toLowerCase();
  for (const proto of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return { ok: false, reason: "blocked_protocol" };
    }
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }

  if (requireHttps) {
    if (url.protocol !== "https:") {
      return { ok: false, reason: "https_required" };
    }
  } else if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "unsupported_protocol" };
  }

  // Block obvious localhost in production
  if (
    requireHttps &&
    (url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".local"))
  ) {
    return { ok: false, reason: "localhost_blocked" };
  }

  return { ok: true, url, href: url.toString() };
}

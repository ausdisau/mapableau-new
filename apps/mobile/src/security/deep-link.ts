
const ALLOWED_HOSTS = new Set(["mapable.com.au", "www.mapable.com.au"]);
const ALLOWED_SCHEMES = new Set(["mapable", "https"]);

export type DeepLinkValidation =
  | { ok: true; path: string }
  | { ok: false; reason: string };

export function validateDeepLink(url: string): DeepLinkValidation {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_SCHEMES.has(parsed.protocol.replace(":", ""))) {
      return { ok: false, reason: "scheme_not_allowed" };
    }
    if (parsed.protocol === "https:" && !ALLOWED_HOSTS.has(parsed.hostname)) {
      return { ok: false, reason: "host_not_allowed" };
    }
    if (parsed.protocol === "mapable:" || parsed.pathname.startsWith("/app")) {
      return { ok: true, path: parsed.pathname || "/" };
    }
    return { ok: false, reason: "path_not_allowed" };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

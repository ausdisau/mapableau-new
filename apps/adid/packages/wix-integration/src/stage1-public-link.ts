/**
 * Stage 1 — verified public AD.iD sign-in link for Wix Editor / Velo sites.
 *
 * Docs index: Wix Unified API Reference
 * (https://dev.wix.com/docs/api-reference/articles/platform-overview/about-the-unified-api-reference)
 *
 * This stage never calls generateSessionToken, never touches Wix Members sessions,
 * and never embeds an untrusted iframe. It only builds a same-window navigation
 * URL to an allowlisted AD.iD host.
 */

export type ApprovedAdidHost = {
  /** Hostname only, lowercase, no port (e.g. adid.example.com). */
  hostname: string;
  /** Optional path prefix; default /sign-in. */
  signInPath?: string;
};

export type PublicLinkResult =
  | { ok: true; href: string; openIn: "same-window" }
  | { ok: false; reason: string };

const DEFAULT_SIGN_IN = "/sign-in";

function isHttpsHostname(hostname: string): boolean {
  if (!hostname || hostname.includes("/") || hostname.includes(":") || hostname.includes("@")) {
    return false;
  }
  // Reject IPs and localhost for production allowlists; allow *.local only in tests via explicit host.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
    hostname,
  ) || hostname.endsWith(".local");
}

/**
 * Build a verified AD.iD sign-in href for Wix navigation.
 * Tokens must never appear in the URL.
 */
export function buildVerifiedAdidSignInLink(input: {
  approvedHosts: readonly ApprovedAdidHost[];
  requestedHost: string;
  /** Optional return path on AD.iD after sign-in (allowlisted relative only). */
  afterSignInPath?: string;
}): PublicLinkResult {
  if (!input.approvedHosts.length) {
    return { ok: false, reason: "no_approved_hosts" };
  }

  const host = input.requestedHost.trim().toLowerCase();
  if (!isHttpsHostname(host)) {
    return { ok: false, reason: "invalid_hostname" };
  }

  const match = input.approvedHosts.find((h) => h.hostname.toLowerCase() === host);
  if (!match) {
    return { ok: false, reason: "host_not_allowlisted" };
  }

  const path = match.signInPath ?? DEFAULT_SIGN_IN;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return { ok: false, reason: "invalid_sign_in_path" };
  }

  const url = new URL(`https://${match.hostname}${path}`);

  if (input.afterSignInPath) {
    const redirect = input.afterSignInPath.trim();
    if (
      !redirect.startsWith("/") ||
      redirect.startsWith("//") ||
      redirect.includes("\\") ||
      /[?&#](access_token|id_token|refresh_token|token)=/i.test(redirect)
    ) {
      return { ok: false, reason: "unsafe_redirect" };
    }
    url.searchParams.set("redirect_url", redirect);
  }

  const href = url.toString();
  if (/[?&#](access_token|id_token|refresh_token|clerk_ticket|token)=/i.test(href)) {
    return { ok: false, reason: "credential_in_url_forbidden" };
  }

  return { ok: true, href, openIn: "same-window" };
}

/** Human-readable label for Wix UI (AAC / SR friendly). */
export const STAGE1_BUTTON_LABEL = "Sign in to AD.iD";
export const STAGE1_BUTTON_HINT =
  "Opens the AD.iD independent identity portal. This is separate from your Wix Members login.";

/**
 * Embed widget CSP `frame-ancestors` allowlist helpers.
 *
 * SECURITY: Never emit `frame-ancestors *`. Only origins listed in
 * `ALLOWED_EMBED_DOMAINS` (comma-separated) may iframe `/embed/*`.
 * When the allowlist is empty or the parent origin is present but not
 * approved, fall back to `frame-ancestors 'self'`.
 */

/** Parse `ALLOWED_EMBED_DOMAINS` into normalised https origins. */
export function parseAllowedEmbedDomains(
  raw: string | undefined = process.env.ALLOWED_EMBED_DOMAINS,
): string[] {
  if (!raw?.trim()) return [];

  const out: string[] = [];
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    try {
      // Allow either full origin (`https://partner.example`) or bare host.
      const url = token.includes("://")
        ? new URL(token)
        : new URL(`https://${token}`);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      // CSP frame-ancestors expects scheme + host (+ optional port), no path.
      const origin = `${url.protocol}//${url.host}`;
      if (!out.includes(origin)) out.push(origin);
    } catch {
      // Ignore malformed entries — fail closed rather than widen the allowlist.
    }
  }
  return out;
}

function originFromRefererOrOrigin(
  referer: string | null,
  origin: string | null,
): string | null {
  for (const candidate of [origin, referer]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      /* continue */
    }
  }
  return null;
}

/**
 * Resolve the enforcing `frame-ancestors` directive value for an embed response.
 *
 * @param requestHeaders - Incoming request headers (Referer / Origin used when present)
 */
export function resolveEmbedFrameAncestors(
  requestHeaders: Headers,
  envAllowlist: string | undefined = process.env.ALLOWED_EMBED_DOMAINS,
): string {
  const allowlist = parseAllowedEmbedDomains(envAllowlist);

  // No approved domains configured → only same-origin framing.
  if (allowlist.length === 0) {
    return "'self'";
  }

  const parentOrigin = originFromRefererOrOrigin(
    requestHeaders.get("referer"),
    requestHeaders.get("origin"),
  );

  if (parentOrigin) {
    // Dynamic check: parent disclosed via Referer/Origin must be on the allowlist.
    if (allowlist.includes(parentOrigin)) {
      return `'self' ${parentOrigin}`;
    }
    // Present but not approved — prevent arbitrary malicious embedding.
    return "'self'";
  }

  // No parent hint (privacy-stripped Referer / direct navigation): emit the
  // full allowlist so registered hosts can still frame; unlisted hosts remain blocked.
  return [`'self'`, ...allowlist].join(" ");
}

/** Full report-only CSP for embed routes with the resolved frame-ancestors. */
export function buildEmbedFrameAncestorsCsp(
  frameAncestors: string,
  buildBaseCsp: (opts: {
    allowUnsafeEval?: boolean;
    frameAncestors?: string;
  }) => string,
): string {
  return buildBaseCsp({
    allowUnsafeEval: true,
    frameAncestors,
  });
}

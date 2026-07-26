/**
 * Baseline security headers for controlled-pilot.
 *
 * CSP default remains Report-Only until a nonce/hash enforcement path is proven
 * safe against Next.js, authentication, Stripe, maps, and required analytics.
 * See docs/remediation/CSP_ENFORCEMENT.md.
 */

/** Inventoried third-party origins used by the public app shell. */
export const CSP_EXTERNAL_ORIGINS = {
  scripts: [
    "https://pagead2.googlesyndication.com",
    "https://www.googletagmanager.com",
    "https://js.stripe.com",
    "https://va.vercel-scripts.com",
  ],
  styles: ["https://fonts.googleapis.com"],
  fonts: ["https://fonts.gstatic.com"],
  images: [
    "https://*.tile.openstreetmap.org",
    "https://*.basemaps.cartocdn.com",
    "https://api.maptiler.com",
    "data:",
    "blob:",
  ],
  connect: [
    "https://*.mapable.com.au",
    "https://api.stripe.com",
    "https://*.googleapis.com",
    "https://*.tile.openstreetmap.org",
    "https://api.maptiler.com",
    "https://vitals.vercel-insights.com",
  ],
  frames: ["https://js.stripe.com", "https://hooks.stripe.com"],
  workers: ["blob:"],
} as const;

export type CspBuildOptions = {
  /**
   * When set, script-src uses nonce and omits 'unsafe-eval'.
   * Callers must inject the matching nonce on every required inline script.
   */
  scriptNonce?: string;
  /** Include 'unsafe-eval' — only for report-only compatibility with current Next.js tooling. */
  allowUnsafeEval?: boolean;
  /**
   * Override `frame-ancestors`. Default `'none'` (clickjacking protection).
   * Embed widget routes use `*` until a registered-provider allowlist ships.
   */
  frameAncestors?: string;
};

function joinSources(sources: readonly string[]): string {
  return sources.join(" ");
}

export function buildContentSecurityPolicy(
  options: CspBuildOptions = {},
): string {
  const allowUnsafeEval = options.allowUnsafeEval ?? !options.scriptNonce;
  const scriptSources = ["'self'"];
  if (options.scriptNonce) {
    scriptSources.push(`'nonce-${options.scriptNonce}'`);
  } else {
    // Report-only compatibility path still requires unsafe-inline until nonces ship.
    scriptSources.push("'unsafe-inline'");
  }
  if (allowUnsafeEval) {
    scriptSources.push("'unsafe-eval'");
  }
  scriptSources.push(...CSP_EXTERNAL_ORIGINS.scripts);

  const frameAncestors = options.frameAncestors?.trim() || "'none'";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'unsafe-inline' ${joinSources(CSP_EXTERNAL_ORIGINS.styles)}`,
    `font-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.fonts)} data:`,
    `img-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.images)}`,
    `connect-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.connect)}`,
    `frame-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.frames)}`,
    `worker-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.workers)}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    // Report sink redacts URI query/secrets — see app/api/security/csp-report
    "report-uri /api/security/csp-report",
  ];
  return directives.join("; ");
}

/** Current production header value — report-only, includes unsafe-eval. */
export function buildContentSecurityPolicyReportOnly(): string {
  return buildContentSecurityPolicy({ allowUnsafeEval: true });
}

/**
 * Future enforce builder. Do not wire into next.config until smoke tests prove
 * Next.js/auth/Stripe/maps survive without unsafe-eval (nonce injection required).
 */
export function buildContentSecurityPolicyEnforce(
  scriptNonce: string,
  options: Pick<CspBuildOptions, "frameAncestors"> = {},
): string {
  if (!scriptNonce.trim()) {
    throw new Error("CSP enforce requires a non-empty script nonce");
  }
  return buildContentSecurityPolicy({
    scriptNonce: scriptNonce.trim(),
    allowUnsafeEval: false,
    frameAncestors: options.frameAncestors,
  });
}

/**
 * CSP for `/embed/*` iframe destinations.
 * `frame-ancestors *` intentionally allows any host to frame the widget.
 *
 * Non-embed routes keep `frame-ancestors 'none'` + `X-Frame-Options: DENY`
 * via `getBaselineSecurityHeaders` / next.config negative-lookahead so the
 * catch-all DENY never re-applies on `/embed/:path*`.
 *
 * Follow-up (registered-provider allowlist): replace `*` with a dynamic
 * allowlist of registered provider domains (e.g. Organisation.embedAllowlist
 * / Partner domain registry). Middleware should then emit
 * `frame-ancestors https://provider.example …` per request after looking up
 * the location's owning organisation. Keep fail-closed (`'none'`) when the
 * location is unknown or embedding is disabled. Do not weaken framing outside
 * `/embed`.
 */
export function buildEmbedFrameAncestorsCsp(
  options: CspBuildOptions = {},
): string {
  return buildContentSecurityPolicy({
    ...options,
    frameAncestors: "*",
  });
}

export type SecurityHeader = { key: string; value: string };

/** Headers applied to non-embed routes. HSTS is left to Vercel. */
export function getBaselineSecurityHeaders(): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicyReportOnly(),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
  ];
}

/**
 * Headers for `/embed/:path*` — allow third-party framing.
 * Omits X-Frame-Options so CSP `frame-ancestors *` controls embedding.
 */
export function getEmbedSecurityHeaders(): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildEmbedFrameAncestorsCsp({ allowUnsafeEval: true }),
    },
    // Enforcing frame-ancestors so it takes precedence over any inherited XFO.
    {
      key: "Content-Security-Policy",
      value: "frame-ancestors *",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
    },
  ];
}

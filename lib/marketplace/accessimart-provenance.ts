/**
 * AccessiMart.zip provenance pin (review-only).
 *
 * Source was supplied 2026-11-10 as a Replit export. This module records the
 * immutable pin and the surfaces that must never be imported into MapAble.
 */

export const ACCESSIMART_PROVENANCE = {
  archiveLabel: "AccessiMart.zip",
  gitCommitSha: "d6b0dc7891e92b5063252f015d4eb02fa667bde9",
  gitCommittedAtUtc: "2026-05-30T10:41:51Z",
  gitSubject:
    "Fix code review blockers: secret exposure, webhook auth, affiliate toggle",
  packageName: "workspace",
  packageVersion: "0.0.0",
  declaredLicence: "MIT",
  licenceFilePresent: false,
  stack: {
    packageManager: "pnpm-workspaces",
    frontend: "React 19 + Vite 7 SPA (Wouter)",
    api: "Express 5",
    database: "PostgreSQL + Drizzle ORM",
    contract: "OpenAPI → Orval (React Query + Zod)",
  },
  promptPackTarget: "Medusa v2 + Next.js + Stripe (not what was built)",
  actualTarget: "Express/Vite MVP with localStorage session and fake checkout",
  seedCounts: {
    categories: 7,
    suppliers: 5,
    products: 13,
  },
  notes: [
    "Only remote in the export was Replit gitsafe-backup (not a public origin).",
    "Seed marks all suppliers verificationStatus=verified without attributable evidence.",
    "Real AU brand/supplier names in seed are demo-only and must be fictionalised in fixtures.",
    "No Stripe, Passport, JWT or OAuth — UUID localStorage session only.",
  ],
} as const;

/** Routes and SPA surfaces that must not be ported into MapAble. */
export const ACCESSIMART_EXCLUDED_SURFACES = [
  "GET/PATCH /api/admin/*",
  "GET/POST/PATCH/DELETE /api/cart/:sessionId…",
  "POST/GET /api/orders and /api/orders/:id",
  "GET /api/quotes without sessionId; PATCH /api/quotes/:id/status",
  "POST/PATCH/DELETE /api/products…",
  "POST/PATCH /api/suppliers… (including dropshippingApiKey)",
  "POST /api/dropship/orders/:orderId/fulfill",
  "POST /api/dropship/webhook/inbound",
  "GET /api/external/amazon/search",
  "GET /api/external/aliexpress/search",
  "SPA AdminDashboard, Cart, Checkout payment stub, ExternalProducts",
  "viewport maximum-scale=1",
] as const;

export const ACCESSIMART_THIRD_PARTY_DEPENDENCY_NOTES = [
  "express ^5, cors, cookie-parser (declared; cookie-parser unused in app.ts)",
  "drizzle-orm, pg",
  "pino / pino-http",
  "react 19, vite 7, wouter, @tanstack/react-query",
  "tailwindcss v4 + shadcn/ui + Radix primitives",
  "uuid (localStorage session helper)",
  "No payment processor SDK; Amazon PA-API and AliExpress affiliate HTTP are present and excluded",
] as const;

export type AccessiMartProvenance = typeof ACCESSIMART_PROVENANCE;

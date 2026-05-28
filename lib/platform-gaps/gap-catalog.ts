import { buildLaunchGapCatalogEntries } from "@/lib/platform-gaps/launch-gap-catalog";
import type { PlatformGapCatalogEntry } from "@/lib/platform-gaps/types";

/** Versioned catalog of platform gaps — curated from Master BP, module READMEs, and integration pack. */
export const PLATFORM_GAP_CATALOG: PlatformGapCatalogEntry[] = [
  // —— Product / Master BP ——
  {
    code: "bp.satellite_apps",
    category: "product",
    title: "Satellite apps not built",
    description:
      "MapAble Independence, Moves, Emergency, Foods, and News are planned ecosystem apps with no live routes yet.",
    severity: "high",
    baseline: "Master Business Plan",
    evidenceLinks: [
      { label: "Core ecosystem roadmap", href: "/core#ecosystem" },
      { label: "Ecosystem config", href: "/docs/mapable-core-ui-design.md" },
    ],
    detector: "ecosystem_roadmap",
  },
  {
    code: "care.ndis_pricing_placeholder",
    category: "product",
    title: "Care NDIS pricing and invoices are placeholders",
    description:
      "Care MVP supports service logs and invoice placeholders only — no live NDIS pricing intelligence or funding claims.",
    severity: "high",
    baseline: "Care MVP README",
    evidenceLinks: [
      { label: "Care module", href: "/care" },
      { label: "README_CARE_MODULE.md", href: "/README_CARE_MODULE.md" },
    ],
    detector: "care_ndis_pricing",
  },
  {
    code: "care.no_ai_matching",
    category: "product",
    title: "Care worker matching is manual",
    description:
      "Tiered care allocation with HITL is available when CARE_ALLOCATION_ENABLED=true. GPS check-in and recurring bookings remain out of scope.",
    severity: "low",
    baseline: "Care MVP README",
    evidenceLinks: [
      { label: "Care module", href: "/care" },
      { label: "Care allocation", href: "/README_CARE_ALLOCATION.md" },
    ],
    detector: "care_allocation_flag",
  },
  {
    code: "transport.no_live_gps",
    category: "product",
    title: "Transport live GPS and route optimisation",
    description:
      "Transport scheduling exists but live tracking and route optimisation remain disabled.",
    severity: "medium",
    baseline: "Transport module README",
    evidenceLinks: [
      { label: "Transport dashboard", href: "/dashboard/transport" },
      { label: "README_TRANSPORT_MODULE.md", href: "/README_TRANSPORT_MODULE.md" },
    ],
    detector: "static_open",
  },
  {
    code: "jobs.not_full_ats",
    category: "product",
    title: "Employment is foundation-only",
    description:
      "Jobs module supports browse/apply and adjustments — not a full ATS, paid employer plans, or AI matching.",
    severity: "medium",
    baseline: "Jobs foundation README",
    evidenceLinks: [
      { label: "Jobs dashboard", href: "/dashboard/jobs" },
      { label: "README_JOBS_FOUNDATION.md", href: "/README_JOBS_FOUNDATION.md" },
    ],
    detector: "static_open",
  },
  {
    code: "core.ui_phase4_polish",
    category: "product",
    title: "Core hub Phase 4 polish",
    description:
      "Optional follow-ups: ecosystem link in global header and role-based signed-in hero CTA on /core.",
    severity: "low",
    baseline: "Core UI design spec",
    evidenceLinks: [
      { label: "Core hub", href: "/core" },
      { label: "Design spec", href: "/docs/mapable-core-ui-design.md" },
    ],
    detector: "static_open",
  },
  // —— Integrations ——
  {
    code: "integ.stub_engines",
    category: "integration",
    title: "OSS integration pack stubs",
    description:
      "Several open-source engines are registered with stub health checks until full adapters ship.",
    severity: "high",
    baseline: "Integration pack",
    evidenceLinks: [{ label: "Integrations admin", href: "/admin/integrations" }],
    detector: "integration_stubs",
  },
  {
    code: "integ.stripe",
    category: "integration",
    title: "Stripe connector health",
    description: "Stripe must be enabled, configured, and healthy for billing flows.",
    severity: "critical",
    baseline: "Integration pack",
    evidenceLinks: [{ label: "Integrations admin", href: "/admin/integrations/stripe" }],
    detector: "integration_health",
    integrationKey: "stripe",
  },
  {
    code: "integ.xero",
    category: "integration",
    title: "Xero connector health",
    description: "Xero accounting sync requires enabled env and healthy connection.",
    severity: "medium",
    baseline: "Integration pack",
    evidenceLinks: [{ label: "Integrations admin", href: "/admin/integrations/xero" }],
    detector: "integration_health",
    integrationKey: "xero",
  },
  {
    code: "integ.ndia",
    category: "integration",
    title: "NDIA readiness connector",
    description: "NDIA integration readiness module and env configuration.",
    severity: "high",
    baseline: "Integration pack",
    evidenceLinks: [
      { label: "Integrations admin", href: "/admin/integrations/ndia" },
      { label: "NDIA readiness", href: "/admin/ndia-readiness" },
    ],
    detector: "integration_health",
    integrationKey: "ndia",
  },
  {
    code: "integ.maplibre",
    category: "integration",
    title: "MapLibre / map integration",
    description: "Accessible maps depend on MapLibre env and style configuration.",
    severity: "medium",
    baseline: "Integration pack",
    evidenceLinks: [{ label: "Integrations admin", href: "/admin/integrations/maplibre" }],
    detector: "integration_health",
    integrationKey: "maplibre",
  },
  {
    code: "integ.auth0_social",
    category: "integration",
    title: "Auth0 social login",
    description:
      "Optional Auth0 social sign-in requires AUTH0_ENABLED and issuer/client credentials.",
    severity: "medium",
    baseline: "Integration env docs",
    evidenceLinks: [
      { label: "Login", href: "/login" },
      { label: "Environment docs", href: "/docs/integrations/environment.md" },
    ],
    detector: "auth0_config",
  },
  // —— Tenancy / auth ——
  {
    code: "tenancy.provider_billing_user_scoped",
    category: "tenancy_auth",
    title: "Provider Pro billing is user-scoped",
    description:
      "Provider Pro attaches to the signed-in user BillingAccount, not the organisation row. All orgs share one plan until org-scoped billing exists.",
    severity: "informational",
    baseline: "Provider Cloud",
    evidenceLinks: [{ label: "Provider Cloud", href: "/provider/cloud" }],
    detector: "provider_billing_tenancy",
  },
  {
    code: "tenancy.provider_auth_dual_paths",
    category: "tenancy_auth",
    title: "Dual provider auth models",
    description:
      "Provider console uses OrganisationMember with a legacy ProviderUserRole bridge — not a single unified role model.",
    severity: "medium",
    baseline: "Provider Cloud",
    evidenceLinks: [{ label: "Provider admin", href: "/provider-admin" }],
    detector: "provider_auth_bridge",
  },
  // —— Launch / ops (full public launch checklist) ——
  ...buildLaunchGapCatalogEntries(),
  // —— Compliance / NDIS ——
  {
    code: "compliance.ndia_real_submission",
    category: "compliance_ndis",
    title: "NDIA real submission disabled",
    description:
      "Platform does not submit to NDIA APIs in production — dry-runs and evidence only until formally approved.",
    severity: "critical",
    baseline: "NDIA readiness",
    evidenceLinks: [{ label: "NDIA readiness", href: "/admin/ndia-readiness" }],
    detector: "ndia_real_submission",
  },
  {
    code: "compliance.no_auto_ndis_commission",
    category: "compliance_ndis",
    title: "No automatic NDIS or Commission submission",
    description:
      "MapAble does not auto-submit NDIS claims or Quality and Safeguards Commission reports — human approval required.",
    severity: "informational",
    baseline: "Platform policy",
    evidenceLinks: [
      { label: "Safety docs", href: "/docs/safety.md" },
      { label: "Billing docs", href: "/docs/billing.md" },
    ],
    detector: "static_met",
  },
];

export function getPlatformGapCatalogEntry(
  code: string
): PlatformGapCatalogEntry | undefined {
  return PLATFORM_GAP_CATALOG.find((e) => e.code === code);
}

export function assertUniqueCatalogCodes(): void {
  const codes = PLATFORM_GAP_CATALOG.map((e) => e.code);
  const unique = new Set(codes);
  if (unique.size !== codes.length) {
    throw new Error("PLATFORM_GAP_CATALOG contains duplicate codes");
  }
}

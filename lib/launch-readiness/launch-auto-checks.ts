import type { LaunchReadinessStatus } from "@prisma/client";

import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";
import {
  getIntegrationAdapter,
  listIntegrationsPublic,
} from "@/lib/integrations/integration-registry";
import { PUBLIC_LAUNCH_CHECKLIST_CODES } from "@/lib/launch-readiness/public-launch-checklist";
import { prisma } from "@/lib/prisma";

export type LaunchAutoCheckResult = {
  code: string;
  suggestedStatus: LaunchReadinessStatus;
  summary: string;
  canAutoApply: boolean;
  details?: string[];
};

const CRITICAL_INTEGRATION_KEYS = ["stripe", "postgres", "maplibre", "ndia"] as const;

const AUTO_CHECK_CODES = new Set<string>([
  "STRIPE_PRODUCTION_VERIFIED",
  "PROD_INTEGRATIONS_HEALTHY",
  "OBSERVABILITY_ALERTS",
  "SECURITY_CONTROLS_REVIEWED",
  "CONSENT_FLOWS_REVIEWED",
  "PRIVACY_POLICY_LIVE",
  "TERMS_OF_SERVICE_LIVE",
]);

export function isLaunchAutoCheckSupported(code: string): boolean {
  return AUTO_CHECK_CODES.has(code);
}

export function listLaunchAutoCheckCodes(): string[] {
  return PUBLIC_LAUNCH_CHECKLIST_CODES.filter((code) =>
    AUTO_CHECK_CODES.has(code)
  );
}

export async function runLaunchAutoCheck(
  code: string
): Promise<LaunchAutoCheckResult> {
  if (!AUTO_CHECK_CODES.has(code)) {
    return {
      code,
      suggestedStatus: "not_started",
      summary: "No automated check configured for this item.",
      canAutoApply: false,
    };
  }

  switch (code) {
    case "STRIPE_PRODUCTION_VERIFIED":
      return checkStripeProduction();
    case "PROD_INTEGRATIONS_HEALTHY":
      return checkProdIntegrations();
    case "OBSERVABILITY_ALERTS":
      return checkObservabilityAlerts();
    case "SECURITY_CONTROLS_REVIEWED":
      return checkSecurityControls();
    case "CONSENT_FLOWS_REVIEWED":
      return checkConsentFlows();
    case "PRIVACY_POLICY_LIVE":
      return checkPublicRouteLive("/privacy", code);
    case "TERMS_OF_SERVICE_LIVE":
      return checkPublicRouteLive("/terms", code);
    default:
      return {
        code,
        suggestedStatus: "not_started",
        summary: "Check not implemented.",
        canAutoApply: false,
      };
  }
}

async function checkStripeProduction(): Promise<LaunchAutoCheckResult> {
  const details: string[] = [];
  if (!isBillingStripeConfigured()) {
    return {
      code: "STRIPE_PRODUCTION_VERIFIED",
      suggestedStatus: "blocked",
      summary: "Stripe is not configured in this environment.",
      canAutoApply: false,
      details,
    };
  }

  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  const isTestKey = secret.startsWith("sk_test");
  const isProdEnv = process.env.NODE_ENV === "production";
  if (isProdEnv && isTestKey) {
    details.push("Production NODE_ENV is using a test Stripe secret key.");
    return {
      code: "STRIPE_PRODUCTION_VERIFIED",
      suggestedStatus: "blocked",
      summary: "Test Stripe keys detected in production.",
      canAutoApply: false,
      details,
    };
  }

  let stripeHealthy = false;
  try {
    const stripeAdapter = getIntegrationAdapter("stripe");
    if (stripeAdapter.isEnabled()) {
      const health = await stripeAdapter.healthCheck();
      stripeHealthy = health.status === "healthy";
    }
  } catch {
    stripeHealthy = false;
  }

  if (stripeHealthy && !isTestKey) {
    return {
      code: "STRIPE_PRODUCTION_VERIFIED",
      suggestedStatus: "ready",
      summary: "Stripe integration reports healthy and live keys are in use.",
      canAutoApply: true,
      details,
    };
  }

  details.push(`Stripe healthy: ${stripeHealthy}`);
  return {
    code: "STRIPE_PRODUCTION_VERIFIED",
    suggestedStatus: "in_progress",
    summary: "Stripe configured but production verification incomplete.",
    canAutoApply: false,
    details,
  };
}

async function checkProdIntegrations(): Promise<LaunchAutoCheckResult> {
  const integrations = await listIntegrationsPublic();
  const details: string[] = [];
  let allHealthy = true;

  for (const key of CRITICAL_INTEGRATION_KEYS) {
    const row = integrations.find((i) => i.key === key);
    if (!row?.enabled) {
      allHealthy = false;
      details.push(`${key}: not enabled`);
      continue;
    }
    try {
      const adapter = getIntegrationAdapter(key);
      const health = await adapter.healthCheck();
      if (health.status !== "healthy") {
        allHealthy = false;
        details.push(`${key}: ${health.status} — ${health.message ?? ""}`);
      }
    } catch (err) {
      allHealthy = false;
      details.push(
        `${key}: check failed — ${err instanceof Error ? err.message : "error"}`
      );
    }
  }

  return {
    code: "PROD_INTEGRATIONS_HEALTHY",
    suggestedStatus: allHealthy ? "ready" : "blocked",
    summary: allHealthy
      ? "Critical integrations (Stripe, Postgres, MapLibre, NDIA) are enabled and healthy."
      : "One or more critical integrations are unhealthy or disabled.",
    canAutoApply: allHealthy,
    details,
  };
}

async function checkObservabilityAlerts(): Promise<LaunchAutoCheckResult> {
  const details: string[] = [];
  const hasSentry = Boolean(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  );
  const hasAppUrl = Boolean(
    process.env.NEXT_PUBLIC_APP_URL ?? billingCoreConfig.appUrl
  );

  if (hasSentry) details.push("Sentry DSN configured.");
  else details.push("Sentry DSN not set (optional but recommended).");

  if (hasAppUrl) details.push("App URL configured for alert links.");

  const suggestedStatus: LaunchReadinessStatus =
    hasAppUrl && (hasSentry || process.env.NODE_ENV !== "production")
      ? "in_progress"
      : "not_started";

  return {
    code: "OBSERVABILITY_ALERTS",
    suggestedStatus,
    summary: hasSentry
      ? "Baseline observability env present; confirm oncall routing manually."
      : "Configure error monitoring (e.g. Sentry) and uptime alerts before marking ready.",
    canAutoApply: false,
    details,
  };
}

async function checkSecurityControls(): Promise<LaunchAutoCheckResult> {
  const frameworks = await prisma.securityFramework.findMany({
    include: {
      controls: { select: { status: true } },
    },
  });

  const details: string[] = [];
  if (frameworks.length === 0) {
    return {
      code: "SECURITY_CONTROLS_REVIEWED",
      suggestedStatus: "not_started",
      summary: "No security frameworks seeded — review admin security readiness first.",
      canAutoApply: false,
      details,
    };
  }

  const criticalOpen = frameworks.some((fw) =>
    fw.controls.some((c) => c.status === "not_started")
  );

  if (!criticalOpen) {
    return {
      code: "SECURITY_CONTROLS_REVIEWED",
      suggestedStatus: "ready",
      summary: `${frameworks.length} framework(s) loaded with no controls still at not_started.`,
      canAutoApply: true,
      details,
    };
  }

  details.push("Some controls remain not_started — triage in Security admin.");
  return {
    code: "SECURITY_CONTROLS_REVIEWED",
    suggestedStatus: "in_progress",
    summary: "Security frameworks exist but outstanding controls need review.",
    canAutoApply: false,
    details,
  };
}

async function checkConsentFlows(): Promise<LaunchAutoCheckStatusResult> {
  const consentRecordCount = await prisma.consentRecord.count().catch(() => 0);
  const details: string[] = [
    `ConsentRecord rows: ${consentRecordCount} (scopes defined in schema).`,
  ];

  return {
    code: "CONSENT_FLOWS_REVIEWED",
    suggestedStatus: "in_progress",
    summary:
      "Consent model is present; complete legal/product review of Care, peer, and data-sharing flows before marking ready.",
    canAutoApply: false,
    details,
  };
}

type LaunchAutoCheckStatusResult = LaunchAutoCheckResult;

async function checkPublicRouteLive(
  path: string,
  code: string
): Promise<LaunchAutoCheckResult> {
  const base =
    billingCoreConfig.appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}${path}`;
  let ok = false;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    ok = res.ok;
  } catch {
    ok = false;
  }

  return {
    code,
    suggestedStatus: ok ? "ready" : "not_started",
    summary: ok
      ? `${path} returned HTTP 200.`
      : `${path} is not reachable with HTTP 200 from app URL (${url}).`,
    canAutoApply: ok,
  };
}

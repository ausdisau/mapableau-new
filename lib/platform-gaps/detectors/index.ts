import { CORE_ECOSYSTEM_APPS } from "@/lib/core-ui/ecosystem";
import { phase5Config } from "@/lib/config/phase5";
import {
  getIntegrationAdapter,
  listIntegrationsPublic,
} from "@/lib/integrations/integration-registry";
import type {
  PlatformGapCatalogEntry,
  PlatformGapDetectionResult,
  PlatformGapDetectorId,
} from "@/lib/platform-gaps/types";
import { prisma } from "@/lib/prisma";

const STUB_INTEGRATION_KEYS = [
  "keycloak",
  "supabase",
  "supabase_realtime",
  "socketio",
  "temporal",
  "n8n",
  "directus",
  "metabase",
  "medplum",
  "hapi_fhir",
  "jitsi",
  "livekit",
  "calcom",
  "erpnext",
] as const;

function isStubHealthMessage(message: string | undefined): boolean {
  return Boolean(message?.toLowerCase().includes("stub"));
}

export async function runPlatformGapDetector(
  entry: PlatformGapCatalogEntry
): Promise<PlatformGapDetectionResult> {
  const id = entry.detector;
  if (!id) {
    return {
      detectedStatus: "open",
      detectedSummary: "No detector configured — treat as open",
    };
  }
  return detectors[id](entry);
}

const detectors: Record<
  PlatformGapDetectorId,
  (entry: PlatformGapCatalogEntry) => Promise<PlatformGapDetectionResult>
> = {
  ecosystem_roadmap: async () => {
    const roadmap = CORE_ECOSYSTEM_APPS.filter((a) => a.status === "roadmap");
    if (roadmap.length === CORE_ECOSYSTEM_APPS.length) {
      return {
        detectedStatus: "open",
        detectedSummary: `${roadmap.length} satellite apps on roadmap only (no live routes)`,
      };
    }
    return {
      detectedStatus: "partial",
      detectedSummary: `${roadmap.length} of ${CORE_ECOSYSTEM_APPS.length} apps still roadmap`,
    };
  },

  integration_stubs: async () => {
    const enabledStubs: string[] = [];
    for (const key of STUB_INTEGRATION_KEYS) {
      const adapter = getIntegrationAdapter(key);
      if (adapter.isEnabled()) {
        enabledStubs.push(key);
      }
    }
    if (enabledStubs.length === 0) {
      return {
        detectedStatus: "partial",
        detectedSummary: `${STUB_INTEGRATION_KEYS.length} stub adapters registered; none enabled via env`,
      };
    }
    return {
      detectedStatus: "open",
      detectedSummary: `${enabledStubs.length} stub adapter(s) enabled: ${enabledStubs.slice(0, 5).join(", ")}${enabledStubs.length > 5 ? "…" : ""}`,
    };
  },

  integration_health: async (entry) => {
    const key = entry.integrationKey;
    if (!key) {
      return { detectedStatus: "open", detectedSummary: "Missing integration key" };
    }
    const integrations = await listIntegrationsPublic();
    const row = integrations.find((i) => i.key === key);
    if (!row) {
      return {
        detectedStatus: "open",
        detectedSummary: `${key} not registered in integration registry`,
      };
    }
    if (!row.configured) {
      return {
        detectedStatus: "open",
        detectedSummary: `${row.displayName} not configured`,
      };
    }
    if (!row.enabled) {
      return {
        detectedStatus: "partial",
        detectedSummary: `${row.displayName} configured but disabled`,
      };
    }
    if (row.status === "enabled") {
      const adapter = getIntegrationAdapter(key);
      const health = await adapter.healthCheck();
      if (isStubHealthMessage(health.message)) {
        return {
          detectedStatus: "partial",
          detectedSummary: `${row.displayName} enabled (stub adapter)`,
        };
      }
      return {
        detectedStatus: "met",
        detectedSummary: `${row.displayName} operational`,
      };
    }
    return {
      detectedStatus: "open",
      detectedSummary: `${row.displayName}: ${row.status}${row.lastError ? ` — ${row.lastError}` : ""}`,
    };
  },

  launch_item_sync: async (entry) => {
    const code = entry.launchItemCode;
    if (!code) {
      return { detectedStatus: "open", detectedSummary: "Missing launch item code" };
    }
    const item = await prisma.launchReadinessItem.findUnique({
      where: { code },
    });
    if (!item) {
      return {
        detectedStatus: "open",
        detectedSummary: `Launch item ${code} not seeded`,
      };
    }
    switch (item.status) {
      case "ready":
      case "waived":
        return {
          detectedStatus: "met",
          detectedSummary: `Launch checklist: ${item.status.replace(/_/g, " ")}`,
        };
      case "in_progress":
        return {
          detectedStatus: "partial",
          detectedSummary: "Launch checklist: in progress",
        };
      case "blocked":
        return {
          detectedStatus: "open",
          detectedSummary: "Launch checklist: blocked",
        };
      default:
        return {
          detectedStatus: "open",
          detectedSummary: "Launch checklist: not started",
        };
    }
  },

  care_allocation_flag: async () => {
    const enabled = process.env.CARE_ALLOCATION_ENABLED === "true";
    if (enabled) {
      return {
        detectedStatus: "partial",
        detectedSummary:
          "Care allocation with HITL enabled — GPS check-in and recurring bookings still out of scope",
      };
    }
    return {
      detectedStatus: "open",
      detectedSummary:
        "Care allocation available but disabled (set CARE_ALLOCATION_ENABLED=true)",
    };
  },

  static_open: async () => ({
    detectedStatus: "open",
    detectedSummary: "Documented limitation — not yet implemented",
  }),

  static_partial: async () => ({
    detectedStatus: "partial",
    detectedSummary: "Partially implemented",
  }),

  static_met: async () => ({
    detectedStatus: "met",
    detectedSummary: "By design / policy satisfied",
  }),

  ndia_real_submission: async () => {
    if (phase5Config.ndiaRealSubmissionEnabled) {
      return {
        detectedStatus: "open",
        detectedSummary: "NDIA real submission flag is ON — verify approval before production",
      };
    }
    return {
      detectedStatus: "met",
      detectedSummary: "NDIA real submission disabled (pilot-safe)",
    };
  },

  auth0_config: async () => {
    const enabled = process.env.AUTH0_ENABLED === "true";
    if (!enabled) {
      return {
        detectedStatus: "partial",
        detectedSummary: "Auth0 not enabled (email/password and other providers only)",
      };
    }
    const hasClient =
      Boolean(process.env.AUTH0_CLIENT_ID) &&
      Boolean(process.env.AUTH0_CLIENT_SECRET);
    const hasIssuer =
      Boolean(process.env.AUTH0_ISSUER) || Boolean(process.env.AUTH0_DOMAIN);
    if (hasClient && hasIssuer) {
      return {
        detectedStatus: "met",
        detectedSummary: "Auth0 enabled with client and issuer configured",
      };
    }
    return {
      detectedStatus: "open",
      detectedSummary: "Auth0 enabled but missing client or issuer env",
    };
  },

  provider_billing_tenancy: async () => {
    const withOrgBilling = await prisma.organisation.count({
      where: { billingAccountId: { not: null } },
    });
    if (withOrgBilling > 0) {
      return {
        detectedStatus: "partial",
        detectedSummary: `Organisation billing linked for ${withOrgBilling} org(s); legacy user-scoped subscriptions may remain until migrated`,
      };
    }
    return {
      detectedStatus: "partial",
      detectedSummary:
        "Org-scoped checkout available; link billingAccountId on subscribe — user-scoped accounts still supported",
    };
  },

  provider_auth_bridge: async () => ({
    detectedStatus: "partial",
    detectedSummary:
      "OrganisationMember is the write path; legacy ProviderUserRole is read-only fallback (no new assignments)",
  }),

  care_ndis_pricing: async () => {
    const withCatalogue = await prisma.careInvoiceLink.count({
      where: {
        pricingPlaceholder: { contains: "catalogue cap" },
      },
    });
    if (withCatalogue > 0) {
      return {
        detectedStatus: "partial",
        detectedSummary:
          "Care invoice placeholders use NDIS catalogue caps; auto-claim and plan-managed export remain manual",
      };
    }
    return {
      detectedStatus: "open",
      detectedSummary:
        "Care invoices still use generic placeholders until support item codes and catalogue import are used",
    };
  },
};

/** Exposed for tests — verify stub registry keys match catalog expectations. */
export function getStubIntegrationKeysForTests(): readonly string[] {
  return STUB_INTEGRATION_KEYS;
}

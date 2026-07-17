import { phase5Config } from "@/lib/config/phase5";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
  NdiaAdapterHealthStatus,
} from "@/lib/integrations/integration-types";
import { prisma } from "@/lib/prisma";

export type NdiaHealthDimensions = {
  moduleEnabled: boolean;
  envEnabled: boolean;
  profileConfigured: boolean;
  externallyApproved: boolean;
  suspended: boolean;
  realSubmissionBlocked: boolean;
};

export function deriveNdiaAdapterHealth(
  dimensions: NdiaHealthDimensions
): { status: NdiaAdapterHealthStatus; message: string } {
  if (!dimensions.moduleEnabled || !dimensions.envEnabled) {
    return {
      status: "not_configured",
      message: "NDIA readiness module or integration env flag disabled",
    };
  }

  if (dimensions.suspended) {
    return {
      status: "suspended",
      message: "NDIA integration profile is suspended",
    };
  }

  if (!dimensions.profileConfigured) {
    return {
      status: "not_configured",
      message: "No NDIA external integration profile configured",
    };
  }

  // Direct adapter without external approval must never be healthy.
  if (!dimensions.externallyApproved) {
    return {
      status: "blocked",
      message:
        "Direct NDIA adapter blocked — external approval and certified profile required",
    };
  }

  if (!dimensions.realSubmissionBlocked) {
    return {
      status: "blocked",
      message:
        "NDIA_REAL_SUBMISSION_ENABLED must remain disabled without certified production activation",
    };
  }

  return {
    status: "degraded",
    message:
      "NDIA profile approved for non-production pathways only — not live submission healthy",
  };
}

async function loadNdiaHealthDimensions(): Promise<NdiaHealthDimensions> {
  const moduleEnabled = phase5Config.ndiaReadinessEnabled;
  const envEnabled = isIntegrationEnvEnabled("ndia");

  const profile = await prisma.externalIntegrationProfile.findFirst({
    where: {
      kind: { in: ["ndia_direct_future", "ndia_simulator", "ndia_manual_portal"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      activations: {
        where: { decision: "approved", revokedAt: null },
        take: 1,
      },
    },
  });

  const suspended =
    profile?.status === "suspended" || profile?.status === "revoked";

  const externallyApproved =
    !!profile &&
    (profile.status === "approved" || profile.status === "active") &&
    !!profile.approvedAt &&
    profile.activations.length > 0;

  return {
    moduleEnabled,
    envEnabled,
    profileConfigured: !!profile,
    externallyApproved,
    suspended,
    realSubmissionBlocked: !phase5Config.ndiaRealSubmissionEnabled,
  };
}

export const ndiaAdapter: IntegrationAdapter = {
  key: "ndia",
  type: "finance",
  displayName: "NDIA Provider Claiming",

  isEnabled() {
    return isIntegrationEnvEnabled("ndia") && phase5Config.ndiaReadinessEnabled;
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    const dimensions = await loadNdiaHealthDimensions();
    const derived = deriveNdiaAdapterHealth(dimensions);

    // Map extended NDIA statuses into integration health result.
    // blocked/not_configured/suspended are never reported as healthy.
    const status =
      derived.status === "degraded"
        ? "degraded"
        : derived.status === "healthy"
          ? "healthy"
          : derived.status === "suspended"
            ? "unhealthy"
            : "unhealthy";

    return {
      status,
      ndiaStatus: derived.status,
      message: derived.message,
      dimensions,
    };
  },
};

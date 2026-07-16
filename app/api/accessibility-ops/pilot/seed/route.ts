import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { seedAccessibilityOpsPilot } from "@/lib/accessibility-ops/pilot/pilot-assets";
import { serializeAsset } from "@/lib/accessibility-ops/assets/asset-registry-service";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const disabled = requireOpsFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "assets:write")) {
    return apiForbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      organisationId?: string | null;
    };
    const seeded = await seedAccessibilityOpsPilot({
      ownerUserId: user.id,
      organisationId: body.organisationId ?? null,
    });
    const correlationId = randomUUID();
    await emitAccessibilityOpsAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "accessibility_ops.pilot.seeded",
      entityType: "AccessibilityOpsPilot",
      entityId: correlationId,
      correlationId,
      metadata: {
        assetKeys: Object.values(seeded.assets).map((a) => a.stableKey),
        evaluationCount: seeded.evaluations.length,
        blocking: seeded.blocking,
      },
    });

    return Response.json({
      correlationId,
      blocking: seeded.blocking,
      assets: Object.fromEntries(
        Object.entries(seeded.assets).map(([k, v]) => [k, serializeAsset(v)])
      ),
      evaluations: seeded.evaluations,
    });
  } catch (error) {
    return mapOpsError(error);
  }
}

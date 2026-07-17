import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  listAccessibilityAssets,
  registerAccessibilityAsset,
  serializeAsset,
  createAccessibilityAssetVersion,
} from "@/lib/accessibility-ops/assets/asset-registry-service";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import type { AccessibilityAssetInput } from "@/lib/accessibility-ops/types";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const disabled = requireOpsFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "assets:read")) {
    return apiForbidden();
  }

  try {
    const url = new URL(request.url);
    const organisationId = url.searchParams.get("organisationId");
    const assets = await listAccessibilityAssets(organisationId);
    return Response.json({ assets: assets.map(serializeAsset) });
  } catch (error) {
    return mapOpsError(error);
  }
}

export async function POST(request: Request) {
  const disabled = requireOpsFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "assets:write")) {
    return apiForbidden();
  }

  try {
    const body = (await request.json()) as AccessibilityAssetInput & {
      versionLabel?: string;
    };
    const asset = await registerAccessibilityAsset({
      ...body,
      ownerUserId: body.ownerUserId ?? user.id,
    });
    if (body.versionLabel) {
      await createAccessibilityAssetVersion(asset.id, {
        versionLabel: body.versionLabel,
      });
    }
    const correlationId = randomUUID();
    await emitAccessibilityOpsAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "accessibility_ops.asset.registered",
      entityType: "AccessibilityAsset",
      entityId: asset.id,
      organisationId: asset.organisationId,
      correlationId,
      metadata: { stableKey: asset.stableKey, criticality: asset.criticality },
    });
    const fresh = await listAccessibilityAssets(asset.organisationId);
    const created = fresh.find((a) => a.id === asset.id)!;
    return Response.json(
      { asset: serializeAsset(created), correlationId },
      { status: 201 }
    );
  } catch (error) {
    return mapOpsError(error);
  }
}

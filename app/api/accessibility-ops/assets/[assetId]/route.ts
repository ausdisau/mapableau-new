import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  getAccessibilityAsset,
  serializeAsset,
  createAccessibilityAssetVersion,
  linkAccessibilityAssetDependency,
} from "@/lib/accessibility-ops/assets/asset-registry-service";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const disabled = requireOpsFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "assets:read")) {
    return apiForbidden();
  }

  try {
    const { assetId } = await params;
    const asset = await getAccessibilityAsset(assetId);
    if (!asset) return Response.json({ error: "ASSET_NOT_FOUND" }, { status: 404 });
    return Response.json({ asset: serializeAsset(asset) });
  } catch (error) {
    return mapOpsError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const disabled = requireOpsFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "assets:write")) {
    return apiForbidden();
  }

  try {
    const { assetId } = await params;
    const body = (await request.json()) as {
      action: "create_version" | "add_dependency";
      versionLabel?: string;
      changelog?: string;
      sourceRevision?: string;
      dependsOnAssetId?: string;
      dependencyType?: string;
    };

    if (body.action === "create_version") {
      if (!body.versionLabel) {
        return Response.json({ error: "versionLabel required" }, { status: 400 });
      }
      const version = await createAccessibilityAssetVersion(assetId, {
        versionLabel: body.versionLabel,
        changelog: body.changelog,
        sourceRevision: body.sourceRevision,
      });
      const correlationId = randomUUID();
      await emitAccessibilityOpsAudit({
        actorUserId: user.id,
        actorRole: user.primaryRole,
        action: "accessibility_ops.asset.version_created",
        entityType: "AccessibilityAssetVersion",
        entityId: version.id,
        correlationId,
        metadata: { assetId, versionLabel: version.versionLabel },
      });
      const asset = await getAccessibilityAsset(assetId);
      return Response.json({
        version,
        asset: asset ? serializeAsset(asset) : null,
        correlationId,
      });
    }

    if (body.action === "add_dependency") {
      if (!body.dependsOnAssetId) {
        return Response.json(
          { error: "dependsOnAssetId required" },
          { status: 400 }
        );
      }
      const dep = await linkAccessibilityAssetDependency(
        assetId,
        body.dependsOnAssetId,
        body.dependencyType
      );
      const asset = await getAccessibilityAsset(assetId);
      return Response.json({
        dependency: dep,
        asset: asset ? serializeAsset(asset) : null,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return mapOpsError(error);
  }
}

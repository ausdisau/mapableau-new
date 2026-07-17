import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  listCivicAssets,
  registerCivicAsset,
  serializeCivicAsset,
  createCivicAssetVersion,
  linkCivicExternalReference,
} from "@/lib/civic-access/assets/asset-registry-service";
import { emitCivicAudit } from "@/lib/civic-access/audit";
import { mapCivicError, requireCivicFlag } from "@/lib/civic-access/http";
import { hasCivicCapability } from "@/lib/civic-access/permissions";
import type { CivicAssetInput } from "@/lib/civic-access/types";
import { accessPlaceCanonicalRef } from "@/lib/civic-access/canonical-refs";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const disabled = requireCivicFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasCivicCapability(user, "assets:read")) {
    return apiForbidden();
  }

  try {
    const url = new URL(request.url);
    const organisationId = url.searchParams.get("organisationId");
    const assets = await listCivicAssets(
      organisationId === null ? undefined : organisationId
    );
    return Response.json({ assets: assets.map(serializeCivicAsset) });
  } catch (error) {
    return mapCivicError(error);
  }
}

export async function POST(request: Request) {
  const disabled = requireCivicFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasCivicCapability(user, "assets:write")) {
    return apiForbidden();
  }

  try {
    const body = (await request.json()) as CivicAssetInput & {
      versionLabel?: string;
    };
    const asset = await registerCivicAsset(body);
    if (body.versionLabel) {
      await createCivicAssetVersion(asset.id, {
        versionLabel: body.versionLabel,
      });
    }
    if (asset.accessPlaceId) {
      try {
        await linkCivicExternalReference(asset.id, {
          system: "access_place",
          externalId: asset.accessPlaceId,
          canonicalRef: accessPlaceCanonicalRef(asset.accessPlaceId),
        });
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.message !== "EXTERNAL_REF_CONFLICT"
        ) {
          throw error;
        }
      }
    }
    const correlationId = randomUUID();
    await emitCivicAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "civic.asset_registered",
      entityType: "CivicAsset",
      entityId: asset.id,
      organisationId: asset.organisationId,
      correlationId,
      metadata: {
        stableKey: asset.stableKey,
        accessPlaceId: asset.accessPlaceId,
      },
    });
    const fresh = await listCivicAssets(asset.organisationId);
    const created = fresh.find((a) => a.id === asset.id)!;
    return Response.json(
      { asset: serializeCivicAsset(created), correlationId },
      { status: 201 }
    );
  } catch (error) {
    return mapCivicError(error);
  }
}

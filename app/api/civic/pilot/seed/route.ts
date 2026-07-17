import { randomUUID } from "crypto";

import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { emitCivicAudit } from "@/lib/civic-access/audit";
import { mapCivicError, requireCivicFlag } from "@/lib/civic-access/http";
import { hasCivicCapability } from "@/lib/civic-access/permissions";
import { seedCivicPrecinctPilot } from "@/lib/civic-access/pilot/pilot-seed";
import { serializeCivicAsset } from "@/lib/civic-access/assets/asset-registry-service";

export async function POST(request: Request) {
  const disabled = requireCivicFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasCivicCapability(user, "pilot:seed")) {
    return apiForbidden();
  }

  try {
    let organisationId: string | null = null;
    try {
      const body = (await request.json()) as { organisationId?: string | null };
      organisationId = body.organisationId ?? null;
    } catch {
      organisationId = null;
    }

    const result = await seedCivicPrecinctPilot({ organisationId });
    const correlationId = randomUUID();
    await emitCivicAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "civic.pilot_seeded",
      entityType: "CivicPrecinctPilot",
      entityId: result.source.id,
      organisationId,
      correlationId,
      metadata: {
        assetCount: result.assetCount,
        mode: result.mode,
        publicObservatory: result.publicObservatory,
      },
    });

    return Response.json(
      {
        correlationId,
        mode: result.mode,
        blocking: result.blocking,
        publicObservatory: result.publicObservatory,
        liveIncidents: result.liveIncidents,
        simulation: result.simulation,
        participantJourneyAccess: result.participantJourneyAccess,
        source: result.source,
        assetCount: result.assetCount,
        assets: Object.fromEntries(
          Object.entries(result.assets).map(([key, asset]) => [
            key,
            serializeCivicAsset(asset),
          ])
        ),
        syntheticAccessPlaceIds: result.syntheticAccessPlaceIds,
      },
      { status: 201 }
    );
  } catch (error) {
    return mapCivicError(error);
  }
}

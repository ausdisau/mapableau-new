import { ZodError } from "zod";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { listOrgTripRequests } from "@/lib/transport-mvp/provider-inbox-service";
import {
  createTransportTripRequest,
  listParticipantTripRequests,
} from "@/lib/transport-mvp/trip-request-service";
import { createTransportTripRequestSchema } from "@/lib/validation/transport-mvp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");

  if (scope === "org") {
    const user = await requireApiPermission("transport:read:org");
    if (user instanceof Response) return user;
    const orgIds = await getUserOrganisationIds(user.id);
    const requests = await listOrgTripRequests(orgIds);
    return jsonOk({ requests });
  }

  const user = await requireApiPermission("transport:read:self");
  if (user instanceof Response) return user;
  const requests = await listParticipantTripRequests(user.id);
  return jsonOk({ requests });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;

  try {
    const parsed = createTransportTripRequestSchema.parse(await req.json());
    const request = await createTransportTripRequest({
      participantId: user.id,
      pickupAddress: parsed.pickupAddress,
      dropoffAddress: parsed.dropoffAddress,
      pickupWindowStart: new Date(parsed.pickupWindowStart),
      pickupWindowEnd: parsed.pickupWindowEnd
        ? new Date(parsed.pickupWindowEnd)
        : undefined,
      pickupLat: parsed.pickupLat,
      pickupLng: parsed.pickupLng,
      dropoffLat: parsed.dropoffLat,
      dropoffLng: parsed.dropoffLng,
      pickupNotes: parsed.pickupNotes,
      dropoffNotes: parsed.dropoffNotes,
      passengerCount: parsed.passengerCount,
      organisationId: parsed.organisationId,
      wheelchairRequired: parsed.wheelchairRequired,
      assistedPickup: parsed.assistedPickup,
      assistedDropoff: parsed.assistedDropoff,
      driverAssistanceRequired: parsed.driverAssistanceRequired,
      mobilityAidsJson: parsed.mobilityAidsJson,
      assistanceNotes: parsed.assistanceNotes,
      shareAccessibility: parsed.shareAccessibility,
      shareAccessibilityConfirmed: parsed.shareAccessibilityConfirmed,
    });
    return jsonOk({ request }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError("Consent required for accessibility sharing", 403);
    }
    return jsonError("Create failed", 500);
  }
}

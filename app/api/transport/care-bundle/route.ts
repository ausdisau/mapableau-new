import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createCareTransportBundle } from "@/lib/transport-osm/care-transport-bundle";
import { careTransportBundleSchema } from "@/lib/validation/transport-osm";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;

  try {
    const parsed = careTransportBundleSchema.parse(await req.json());
    const result = await createCareTransportBundle({
      participantId: user.id,
      createdById: user.id,
      careTitle: parsed.careTitle,
      careDescription: parsed.careDescription,
      carePreferredDate: parsed.carePreferredDate
        ? new Date(parsed.carePreferredDate)
        : undefined,
      pickupAddress: parsed.pickupAddress,
      dropoffAddress: parsed.dropoffAddress,
      pickupWindowStart: new Date(parsed.pickupWindowStart),
      pickupWindowEnd: parsed.pickupWindowEnd
        ? new Date(parsed.pickupWindowEnd)
        : undefined,
      accessNeeds: parsed.accessNeeds,
      mobilityAidSnapshot: parsed.mobilityAidSnapshot,
      vehicleRequirements: parsed.vehicleRequirements,
      communicationPreferences: parsed.communicationPreferences,
      companionCount: parsed.companionCount,
      pickupNotes: parsed.pickupNotes,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Bundle create failed", 500);
  }
}

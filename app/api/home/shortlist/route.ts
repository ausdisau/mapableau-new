import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  addPropertyToShortlist,
  HomeShortlistDisabledError,
  listShortlistedProperties,
} from "@/lib/home-living/discovery/shortlist-service";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return jsonError("Home shortlist is disabled", 404);
  }
  try {
    const properties = await listShortlistedProperties(user.id);
    return jsonOk({ properties });
  } catch (error) {
    if (error instanceof HomeShortlistDisabledError) {
      return jsonError("Home shortlist is disabled", 404);
    }
    return jsonError("Unable to load shortlist", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return jsonError("Home shortlist is disabled", 404);
  }
  const parsed = z
    .object({ propertyId: z.string().min(1) })
    .safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const item = await addPropertyToShortlist({
      participantId: user.id,
      propertyId: parsed.data.propertyId,
      actorUserId: user.id,
    });
    return jsonOk({ item }, 201);
  } catch (error) {
    if (error instanceof HomeShortlistDisabledError) {
      return jsonError("Home shortlist is disabled", 404);
    }
    if (error instanceof Error && error.message === "PROPERTY_NOT_FOUND") {
      return jsonError("Property not found", 404);
    }
    return jsonError("Unable to update shortlist", 500);
  }
}

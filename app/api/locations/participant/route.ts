import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createParticipantLocation,
  listParticipantLocations,
} from "@/lib/locations/participant-location-service";
import { participantLocationSchema } from "@/lib/validation/scheduling";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const locations = await listParticipantLocations(user.id);
  return jsonOk(locations);
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = participantLocationSchema.parse(await req.json());
    const loc = await createParticipantLocation({
      participantId: user.id,
      actorUserId: user.id,
      ...body,
    });
    return jsonOk(loc, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not save location", 500);
  }
}

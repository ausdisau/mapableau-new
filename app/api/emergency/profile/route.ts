import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getEmergencyProfile,
  upsertEmergencyProfile,
} from "@/lib/emergency/profile-service";
import { emergencyProfileSchema } from "@/lib/validation/emergency";

export async function GET() {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const profile = await getEmergencyProfile(user.id);
  return jsonOk({ profile });
}

export async function PUT(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = emergencyProfileSchema.parse(await req.json());
    const profile = await upsertEmergencyProfile(
      user.id,
      parsed,
      user.id,
    );
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}

import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getDietaryProfile,
  upsertDietaryProfile,
} from "@/lib/foods/dietary-profile-service";
import { dietaryProfileSchema } from "@/lib/validation/foods";

export async function GET() {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const profile = await getDietaryProfile(user.id);
  return jsonOk({ profile });
}

export async function PUT(req: Request) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = dietaryProfileSchema.parse(await req.json());
    const profile = await upsertDietaryProfile(user.id, parsed, user.id);
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}

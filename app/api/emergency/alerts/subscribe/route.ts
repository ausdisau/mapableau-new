import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { subscribeToRegion } from "@/lib/emergency/alert-service";
import { disasterSubscribeSchema } from "@/lib/validation/emergency";

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = disasterSubscribeSchema.parse(await req.json());
    const sub = await subscribeToRegion(user.id, parsed.regionCode);
    return jsonOk({ subscription: sub }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Subscribe failed", 500);
  }
}

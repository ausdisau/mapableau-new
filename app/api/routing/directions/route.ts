import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { computeRoute } from "@/lib/routing/routing-service";
import { directionsBodySchema } from "@/lib/validation/routing";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = directionsBodySchema.parse(await req.json());
    const result = await computeRoute(body.stops);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message.startsWith("PII_")) {
      return jsonError("Invalid routing payload", 400);
    }
    return jsonError("Routing failed", 500);
  }
}

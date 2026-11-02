import { ZodError } from "zod";

import { handleBridge } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";

export async function POST(req: Request) {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    return jsonOk(handleBridge(body));
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Bridge call failed.", 400);
  }
}

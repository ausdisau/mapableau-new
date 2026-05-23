import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getBatchMatrix } from "@/lib/routing/travel-matrix-service";
import { matrixBodySchema } from "@/lib/validation/routing";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = matrixBodySchema.parse(await req.json());
    const cells = await getBatchMatrix(body.points);
    return jsonOk({ cells });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Matrix failed", 500);
  }
}

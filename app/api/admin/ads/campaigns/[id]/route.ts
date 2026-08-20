import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "APPROVED",
      "ACTIVE",
      "PAUSED",
      "ENDED",
      "REJECTED",
      "DISABLED",
    ])
    .optional(),
  name: z.string().min(1).max(200).optional(),
  priority: z.number().int().optional(),
  placementCodes: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const campaign = await prisma.adCampaign.update({
    where: { id },
    data: parsed.data,
  });

  return jsonOk({ campaign });
}

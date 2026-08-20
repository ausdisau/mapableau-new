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
  headline: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
  destinationUrl: z.string().url().optional(),
  altText: z.string().max(500).optional(),
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

  // Never auto-activate from DRAFT — require APPROVED/ACTIVE explicitly by admin
  if (parsed.data.status === "ACTIVE" || parsed.data.status === "APPROVED") {
    const existing = await prisma.adCreative.findUnique({ where: { id } });
    if (!existing) return jsonError("Not found", 404);
    if (
      existing.status === "DRAFT" &&
      parsed.data.status === "ACTIVE"
    ) {
      return jsonError(
        "Creative must be PENDING_REVIEW then APPROVED before ACTIVE",
        400,
      );
    }
  }

  const creative = await prisma.adCreative.update({
    where: { id },
    data: {
      ...parsed.data,
      reviewedAt:
        parsed.data.status === "APPROVED" || parsed.data.status === "ACTIVE"
          ? new Date()
          : undefined,
      reviewedBy:
        parsed.data.status === "APPROVED" || parsed.data.status === "ACTIVE"
          ? user.id
          : undefined,
    },
  });

  return jsonOk({ creative });
}

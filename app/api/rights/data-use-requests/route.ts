import { randomUUID } from "crypto";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isRightsOsEnabled } from "@/lib/rights-os/config";
import { shadowEvaluateAndLog } from "@/lib/rights-os/shadow-logger";
import { createDataUseRequestSchema } from "@/lib/validation/rights-os";
import { ZodError } from "zod";

export async function POST(req: Request) {
  if (!isRightsOsEnabled()) {
    return jsonError("RightsOS is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createDataUseRequestSchema.parse(await req.json());
    const requestId = parsed.requestId ?? randomUUID();
    const subjectUserId = parsed.subjectUserId ?? user.id;

    if (subjectUserId !== user.id && user.primaryRole !== "mapable_admin") {
      return jsonError("Forbidden", 403);
    }

    const result = await shadowEvaluateAndLog({
      actorUserId: user.id,
      input: {
        requestId,
        requester: parsed.requester,
        recipient: parsed.recipient,
        subjectUserId,
        purposeCode: parsed.purposeCode,
        requestedOperations: parsed.requestedOperations,
        requestedFields: parsed.requestedFields,
        sourceAssets: parsed.sourceAssets,
        context: parsed.context,
        requestedAt: new Date().toISOString(),
        requestedUntil: parsed.requestedUntil,
        onwardSharingRequested: parsed.onwardSharingRequested,
        retentionRequested: parsed.retentionRequested,
      },
    });

    if (!result) {
      return jsonError("RightsOS evaluation failed", 500);
    }

    const { explainPolicyDecision } = await import("@/lib/rights-os/explain");
    const explanation = explainPolicyDecision(result.decision);

    return jsonOk(
      {
        request: { id: result.record.id, requestId },
        decision: result.decision,
        explanation,
        mode: "shadow",
      },
      201
    );
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Request failed", 500);
  }
}

export async function GET() {
  if (!isRightsOsEnabled()) {
    return jsonError("RightsOS is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { prisma } = await import("@/lib/prisma");
  const requests = await prisma.rightsDataUseRequest.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      decisions: { orderBy: { evaluatedAt: "desc" }, take: 1 },
    },
  });

  return jsonOk({ requests });
}

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { reportMarkerCommentSchema } from "@/lib/validation/access-marker";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { commentId } = await params;
  const comment = await prisma.accessMarkerComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) return jsonError("Comment not found", 404);

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = reportMarkerCommentSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const report = await prisma.accessContentReport.create({
    data: {
      entityType: "AccessMarkerComment",
      entityId: commentId,
      reporterId: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: "AccessMarkerComment",
      entityId: commentId,
      flagReason: `User report: ${parsed.data.reason}`,
      priority: 2,
    },
  });

  return jsonOk({ report: { id: report.id, status: report.status } }, 201);
}

import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { bookOtAssessment } from "@/lib/home-modifications/project-milestone-service";
import { assessmentBookingSchema } from "@/lib/validation/home-modifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: requestId } = await params;

  const hmRequest = await prisma.homeModificationRequest.findUnique({
    where: { id: requestId },
  });
  if (!hmRequest) return jsonError("Request not found", 404);
  if (
    hmRequest.participantId !== user.id &&
    user.primaryRole !== "mapable_admin"
  ) {
    return jsonError("Access denied", 403);
  }

  try {
    const body = assessmentBookingSchema.parse(await req.json());
    const result = await bookOtAssessment({
      requestId,
      assessorId: body.assessorId,
      scheduledAt: new Date(body.scheduledAt),
      actorUserId: user.id,
      participantId: hmRequest.participantId,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not book assessment", 400);
  }
}

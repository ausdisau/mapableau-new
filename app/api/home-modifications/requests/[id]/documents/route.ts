import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { uploadHomeModificationDocument } from "@/lib/home-modifications/project-milestone-service";
import { documentUploadSchema } from "@/lib/validation/home-modifications";
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
    const body = documentUploadSchema.parse(await req.json());
    const doc = await uploadHomeModificationDocument({
      requestId,
      participantId: hmRequest.participantId,
      uploadedById: user.id,
      fileName: body.fileName,
      mimeType: body.mimeType,
      storageKey: body.storageKey,
      documentType: body.documentType,
    });
    return jsonOk({ document: doc }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not upload document", 400);
  }
}

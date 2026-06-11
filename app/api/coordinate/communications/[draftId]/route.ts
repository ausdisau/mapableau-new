import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  approveCommunicationDraft,
  updateCommunicationDraft,
} from "@/lib/coordinate/communication-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { draftId } = await params;
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
    );
    const draft = await prisma.coordinateCommunicationDraft.findFirst({
      where: { id: draftId, participantId },
      include: { author: { select: { name: true } } },
    });
    if (!draft) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return jsonOk({ draft });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { draftId } = await params;
    const body = (await req.json()) as {
      participantId?: string;
      action?: "approve" | "update";
      subject?: string;
      body?: string;
      plainLanguageBody?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (body.action === "approve") {
      const draft = await approveCommunicationDraft({
        actorId: user.id,
        actorRole: user.primaryRole,
        draftId,
        participantId,
      });
      return jsonOk({ draft });
    }

    const draft = await updateCommunicationDraft({
      actorId: user.id,
      actorRole: user.primaryRole,
      draftId,
      participantId,
      subject: body.subject,
      body: body.body,
      plainLanguageBody: body.plainLanguageBody,
    });
    return jsonOk({ draft });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

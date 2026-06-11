import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  approveCommunicationDraft,
  createCommunicationDraft,
  listCommunicationDrafts,
  updateCommunicationDraft,
} from "@/lib/coordinate/communication-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
    );
    const drafts = await listCommunicationDrafts({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
    });
    return jsonOk({ drafts });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function POST(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const body = (await req.json()) as {
      participantId?: string;
      channel?: "email" | "sms" | "in_app";
      topic?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.topic?.trim() || !body.channel) {
      return Response.json(
        { error: "topic and channel are required" },
        { status: 400 },
      );
    }

    const result = await createCommunicationDraft({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
      channel: body.channel,
      topic: body.topic,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

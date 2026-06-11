import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import {
  generateProviderShortlist,
  listShortlistItems,
  reviewShortlistItem,
} from "@/lib/coordinate/shortlist-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { planId } = await params;
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
    );
    const items = await listShortlistItems({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
    });
    return jsonOk({ items });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { planId } = await params;
    const body = (await req.json()) as {
      participantId?: string;
      needDescription?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.needDescription?.trim()) {
      return Response.json(
        { error: "needDescription is required" },
        { status: 400 },
      );
    }

    const result = await generateProviderShortlist({
      actorId: user.id,
      actorRole: user.primaryRole,
      planId,
      participantId,
      needDescription: body.needDescription,
    });
    return jsonOk(result, 201);
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    await params;
    const body = (await req.json()) as {
      participantId?: string;
      itemId?: string;
      status?: "approved" | "rejected";
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.itemId || !body.status) {
      return Response.json(
        { error: "itemId and status are required" },
        { status: 400 },
      );
    }

    const item = await reviewShortlistItem({
      actorId: user.id,
      actorRole: user.primaryRole,
      itemId: body.itemId,
      participantId,
      status: body.status,
    });
    return jsonOk({ item });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}

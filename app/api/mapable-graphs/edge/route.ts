import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { createGraphEdgeSchema } from "@/lib/mapable-graphs/schemas";
import { graphService } from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = createGraphEdgeSchema.parse(await req.json());
    if (body.participantId) {
      const access = await requireGraphParticipantAccess(body.participantId);
      if (access instanceof Response) return access;
    }
    const edge = await graphService.createEdge({
      ...body,
      data: body.data,
      createdBy: user.id,
    });
    return jsonOk({ edge }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create graph edge", 500);
  }
}

export async function DELETE(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const edgeId = new URL(req.url).searchParams.get("edgeId");
  if (!edgeId) return jsonError("edgeId required", 400);

  try {
    await graphService.deleteEdge(edgeId);
    return jsonOk({ deleted: true });
  } catch {
    return jsonError("Could not delete edge", 500);
  }
}

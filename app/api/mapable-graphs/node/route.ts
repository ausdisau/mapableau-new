import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import {
  createGraphNodeSchema,
  updateGraphNodeSchema,
} from "@/lib/mapable-graphs/schemas";
import { graphService } from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = createGraphNodeSchema.parse(await req.json());
    if (body.participantId) {
      const access = await requireGraphParticipantAccess(body.participantId);
      if (access instanceof Response) return access;
    }
    const node = await graphService.createNode({
      ...body,
      data: body.data,
      createdBy: user.id,
    });
    return jsonOk({ node }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create graph node", 500);
  }
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);
    const nodeId = url.searchParams.get("nodeId");
    if (!nodeId) return jsonError("nodeId query parameter required", 400);
    const body = updateGraphNodeSchema.parse(await req.json());
    const existing = await graphService.getNode(nodeId);
    if (!existing) return jsonError("Node not found", 404);
    if (existing.participantId) {
      const access = await requireGraphParticipantAccess(
        existing.participantId
      );
      if (access instanceof Response) return access;
    }
    const node = await graphService.updateNode(nodeId, body);
    return jsonOk({ node });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update graph node", 500);
  }
}

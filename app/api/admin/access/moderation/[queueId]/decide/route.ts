import { decideModeration, listModerationQueue } from "@/lib/access-moderation/review-moderation-service";
import { requireAccessModerator } from "@/lib/auth/guards";
import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { isAccessModerator } from "@/lib/access-community/access-role-policy";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { z } from "zod";

const decideSchema = z.object({
  status: z.enum(["approved", "rejected", "hidden", "needs_changes"]),
  notes: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!(await isAccessModerator(user))) return apiForbidden();

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";
  const queue = await listModerationQueue(status);

  return jsonOk({ queue });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!(await isAccessModerator(user))) return apiForbidden();

  const { queueId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = decideSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  const item = await decideModeration({
    queueId,
    moderatorId: user.id,
    status: parsed.data.status,
    notes: parsed.data.notes,
  });

  return jsonOk({ item });
}

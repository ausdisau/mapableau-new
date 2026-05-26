import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listCoordinatorTasks,
  updateCoordinatorTask,
} from "@/lib/care-support/coordinator-tasks";
import { updateCoordinatorTaskSchema } from "@/schemas/care-support";

export async function GET(req: Request) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const tasks = await listCoordinatorTasks(user.id, status ?? undefined);
  return jsonOk({ tasks });
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return jsonError("taskId required", 400);

    const body = updateCoordinatorTaskSchema.parse(await req.json());
    const task = await updateCoordinatorTask(taskId, user.id, body);
    return jsonOk({ task });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Update failed", 500);
  }
}

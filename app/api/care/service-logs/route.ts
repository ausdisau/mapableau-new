import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listServiceLogsForUser,
  submitServiceLogFromShift,
} from "@/lib/care/care-service-log-service";
import { serviceLogSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiPermission("care:read:self");
  if (user instanceof Response) return user;
  const serviceLogs = await listServiceLogsForUser(user);
  return jsonOk({ serviceLogs });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:shift:work");
  if (user instanceof Response) return user;
  const parsed = serviceLogSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const serviceLog = await submitServiceLogFromShift({
      shiftId: parsed.data.shiftId,
      actorUserId: user.id,
      supportItems: parsed.data.supportItems,
      tasksCompleted: parsed.data.tasksCompleted,
      workerNotes: parsed.data.workerNotes,
    });
    return jsonOk({ serviceLog }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to submit service log", 400);
  }
}
import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listServiceLogsForUser,
  submitServiceLogFromShift,
} from "@/lib/care/care-service-log-service";
import { serviceLogSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const serviceLogs = await listServiceLogsForUser(user);
  return jsonOk({ serviceLogs });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:shift:work");
  if (user instanceof Response) return user;
  try {
    const parsed = serviceLogSchema.parse(await req.json());
    const serviceLog = await submitServiceLogFromShift({
      ...parsed,
      workerUserId: user.id,
    });
    return jsonOk({ serviceLog }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "SHIFT_NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Submit service log failed", 500);
  }
}

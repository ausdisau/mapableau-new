import { dclmfMemoryWriteSchema } from "@mapable/contracts";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createMemoryRecord,
  DcLmfError,
  listParticipantMemory,
} from "@/lib/dc-lmf/memory-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const records = await listParticipantMemory(user.id, user.id);
    return jsonOk({ records });
  } catch (error) {
    if (error instanceof DcLmfError) return jsonError(error.message, error.status);
    return jsonError("Unable to read DC-LMF memory", 500);
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = dclmfMemoryWriteSchema.parse(await req.json());
    if (parsed.participantId !== user.id) {
      return jsonError("DC_LMF_SELF_WRITE_REQUIRED", 403);
    }
    const record = await createMemoryRecord({
      ...parsed,
      actorUserId: user.id,
    });
    return jsonOk({ record }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof DcLmfError) return jsonError(error.message, error.status);
    if (error instanceof Error) return jsonError(error.message, 400);
    return jsonError("Unable to create DC-LMF memory", 500);
  }
}

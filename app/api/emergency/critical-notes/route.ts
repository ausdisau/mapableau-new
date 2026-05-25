import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createCriticalNote,
  listCriticalNotes,
} from "@/lib/emergency/critical-notes-service";
import { criticalAccessNoteSchema } from "@/lib/validation/emergency";

export async function GET() {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const notes = await listCriticalNotes(user.id);
  return jsonOk({ notes });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = criticalAccessNoteSchema.parse(await req.json());
    const note = await createCriticalNote(user.id, parsed, user.id);
    return jsonOk({ note }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}

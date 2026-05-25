import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createProgressNote } from "@/lib/moves/clinical-notes-service";
import { progressNoteSchema } from "@/lib/validation/moves";

type Params = { params: Promise<{ appointmentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  try {
    const parsed = progressNoteSchema.parse(await req.json());
    const note = await createProgressNote({
      therapyAppointmentId: appointmentId,
      author: user,
      clinicalContent: parsed.clinicalContent,
      participantSummary: parsed.participantSummary,
    });
    return jsonOk({ note }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CLINICAL_ACCESS_DENIED") {
      return jsonError("Clinical access denied", 403);
    }
    return jsonError("Note creation failed", 500);
  }
}

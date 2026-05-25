import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createHomeModificationRequest } from "@/lib/home-modifications/home-modification-service";
import { homeModificationRequestSchema } from "@/lib/validation/home-modifications";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "participant" && user.primaryRole !== "mapable_admin") {
    return jsonError("Only participants can create home modification requests", 403);
  }

  try {
    const body = homeModificationRequestSchema.parse(await req.json());
    const request = await createHomeModificationRequest({
      participantId: user.id,
      title: body.title,
      description: body.description,
      addressSummary: body.addressSummary,
      fundingNotes: body.fundingNotes,
    });
    return jsonOk({ request }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create request", 400);
  }
}

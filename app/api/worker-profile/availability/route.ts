import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getPrimaryWorkerProfileForUser,
  replaceWorkerAvailabilityWindows,
} from "@/lib/workers/worker-profile-service";
import { availabilityWindowsPatchSchema } from "@/lib/validation/worker";

export async function GET() {
  const user = await requireApiPermission("availability:manage:self");
  if (user instanceof Response) return user;

  const profile = await getPrimaryWorkerProfileForUser(user.id);
  if (!profile) {
    return jsonError("No worker profile linked to your account", 404);
  }

  return jsonOk({ windows: profile.availabilityWindows });
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("availability:manage:self");
  if (user instanceof Response) return user;

  try {
    const raw = await req.json();
    const { windows } = availabilityWindowsPatchSchema.parse(raw);

    const profile = await getPrimaryWorkerProfileForUser(user.id);
    if (!profile) {
      return jsonError("No worker profile linked to your account", 404);
    }

    const updated = await replaceWorkerAvailabilityWindows(
      profile.id,
      profile.organisationId,
      user.id,
      windows
    );

    return jsonOk({ windows: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}

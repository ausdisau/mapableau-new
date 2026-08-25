import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import { HOME_CAPABILITY_KINDS } from "@/lib/home/contracts/capability";
import {
  HomeServiceError,
  getHomeEndpointState,
} from "@/lib/home/service";

const querySchema = z.object({
  endpointId: z.string().min(1),
  capabilityId: z.enum(HOME_CAPABILITY_KINDS),
});

export async function GET(req: Request) {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    endpointId: url.searchParams.get("endpointId"),
    capabilityId: url.searchParams.get("capabilityId"),
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const state = await getHomeEndpointState(
      parsed.data.endpointId,
      parsed.data.capabilityId,
    );
    return jsonOk({ simulation: true, state });
  } catch (err) {
    if (err instanceof HomeServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }
}

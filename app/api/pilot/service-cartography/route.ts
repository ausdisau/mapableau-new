import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isServiceCartographyPilotEnabled,
  serviceCartographyConfig,
} from "@/lib/config/service-cartography";
import {
  CARTOGRAPHY_FAILURE_MODES,
  SERVICE_CARTOGRAPHY_PROHIBITIONS,
  runGoldenSlice,
} from "@/lib/pilot/service-cartography";

const postSchema = z
  .object({
    failureMode: z.enum(CARTOGRAPHY_FAILURE_MODES).optional(),
  })
  .strict();

export async function GET() {
  if (!isServiceCartographyPilotEnabled()) {
    return jsonError("Service Cartography pilot is not enabled", 503);
  }

  return jsonOk({
    pilot: "service_cartography",
    slice: "community_visit",
    participant: "synthetic-participant",
    syntheticOnly: serviceCartographyConfig.syntheticOnly,
    productionClaim: serviceCartographyConfig.productionClaimStatus,
    isLiveMatchingEngine: serviceCartographyConfig.isLiveMatchingEngine,
    isBookingEngine: serviceCartographyConfig.isBookingEngine,
    autoAssignment: serviceCartographyConfig.autoAssignment,
    page: "/pilot/service-cartography",
    prohibitions: SERVICE_CARTOGRAPHY_PROHIBITIONS,
    notice:
      "Synthetic advisory preview — not live matching, booking, payment, or an NDIS decision.",
  });
}

export async function POST(req: Request) {
  if (!isServiceCartographyPilotEnabled()) {
    return jsonError("Service Cartography pilot is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const parsed = postSchema.parse(body ?? {});
    const state = await runGoldenSlice({
      failureMode: parsed.failureMode,
      context: {
        actorUserId: user.id,
        organisationId: null,
        source: "session",
      },
    });
    return jsonOk({
      state,
      actorUserId: user.id,
      productionClaim: serviceCartographyConfig.productionClaimStatus,
      isLiveMatchingEngine: serviceCartographyConfig.isLiveMatchingEngine,
      isBookingEngine: serviceCartographyConfig.isBookingEngine,
      notice:
        "Synthetic advisory simulation — not a booking, payment, NDIS claim, or live match.",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}

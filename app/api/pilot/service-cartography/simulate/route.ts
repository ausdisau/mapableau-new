import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isServiceCartographySimulateEnabled,
  serviceCartographyConfig,
} from "@/lib/config/service-cartography";
import {
  CARTOGRAPHY_FAILURE_MODES,
  runGoldenSlice,
} from "@/lib/pilot/service-cartography";

/**
 * Synthetic-only simulate endpoint for browser / Playwright journeys.
 * Disabled unless the pilot is enabled and synthetic-only remains on.
 */
const querySchema = z
  .object({
    failureMode: z.enum(CARTOGRAPHY_FAILURE_MODES).optional(),
  })
  .strict();

export async function GET(req: Request) {
  if (!isServiceCartographySimulateEnabled()) {
    return jsonError(
      "Synthetic Service Cartography simulate is not enabled (requires pilot + syntheticOnly)",
      503,
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse({
      failureMode: url.searchParams.get("failureMode") ?? undefined,
    });
    const state = await runGoldenSlice({
      failureMode: parsed.failureMode,
      context: {
        actorUserId: null,
        organisationId: null,
        source: "synthetic_simulate",
      },
    });
    return jsonOk({
      state,
      synthetic: true,
      productionClaim: "none",
      isBookingEngine: serviceCartographyConfig.isBookingEngine,
      notice: "Synthetic simulate — not authenticated production matching or booking",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}

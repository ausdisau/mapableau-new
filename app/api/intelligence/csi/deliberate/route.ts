import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  careIntelligenceConfigFromEnv,
  careIntelligenceHealth,
} from "@/lib/care-intelligence/config";
import { deliberateScenarioSchema } from "@/lib/care-intelligence/contracts";
import { runCareIntelligence } from "@/lib/care-intelligence/engine";
import { getScenario } from "@/lib/care-intelligence/scenarios";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const config = careIntelligenceConfigFromEnv();
  const health = careIntelligenceHealth(config);
  if (health.status !== "ready")
    return jsonError(`CSI lab ${health.status}`, 503);

  try {
    const body = deliberateScenarioSchema.parse(await request.json());
    const scenario = getScenario(body.scenarioId);
    if (!scenario) return jsonError("Synthetic scenario not found", 404);
    return jsonOk({ run: runCareIntelligence(scenario, config) });
  } catch (error) {
    if (error instanceof z.ZodError) return zodErrorResponse(error);
    return jsonError("Unable to complete synthetic deliberation", 500);
  }
}

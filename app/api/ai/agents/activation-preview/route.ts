import { z } from "zod";

import { mapAbleModuleSchema } from "@/intelligence/types";
import { selectMapAbleAgents } from "@/lib/ai/platform/agents";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const activationPreviewSchema = z.object({
  objective: z.string().trim().min(3).max(4000),
  domains: z.array(mapAbleModuleSchema).min(1).max(8),
  consentScopes: z.array(z.string()).optional().default([]),
  requestedCapabilities: z.array(z.string()).optional().default([]),
  includeContinuityAnalysis: z.boolean().optional().default(true),
  actorId: z.string().optional().default("admin-preview"),
});

/**
 * Read-only activation preview — performs no operational writes.
 */
export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = activationPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const result = selectMapAbleAgents({
    objective: parsed.data.objective,
    domains: parsed.data.domains,
    actor: {
      actorId: parsed.data.actorId,
      actorType: "admin",
    },
    consentScopes: parsed.data.consentScopes,
    requestedCapabilities: parsed.data.requestedCapabilities,
    includeContinuityAnalysis: parsed.data.includeContinuityAnalysis,
  });

  return jsonOk({
    preview: true,
    writesPerformed: false,
    activeAgents: result.activeAgents,
    unavailableAgents: result.unavailableAgents,
    requiredHumanReviews: result.requiredHumanReviews,
    missingConsentScopes: result.missingConsentScopes,
    disabledCapabilities: result.disabledCapabilities,
    authorityCeiling: result.authorityCeiling,
  });
}

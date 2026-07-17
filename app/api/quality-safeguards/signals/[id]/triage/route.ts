import { z } from "zod";

import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireQsCapability } from "@/lib/quality-safeguards/capabilities";
import { isQualitySafeguardsOpsEnabled } from "@/lib/quality-safeguards/feature-flags";
import { triageSafeguardSignal } from "@/lib/quality-safeguards/signals-service";

const triageSchema = z.object({
  action: z.enum([
    "triage",
    "link",
    "convert_to_case",
    "dismiss_with_reason",
    "request_more_info",
    "record_immediate_action",
  ]),
  reason: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
  linkedSignalId: z.string().optional(),
  convertedResourceType: z.string().optional(),
  convertedResourceId: z.string().optional(),
  assignedUserId: z.string().nullable().optional(),
  urgency: z
    .enum(["critical", "high", "moderate", "low", "unassessed"])
    .optional(),
  immediateSafetyConcern: z.boolean().optional(),
  organisationId: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isQualitySafeguardsOpsEnabled()) {
    return jsonError("Quality & Safeguards Ops Centre is disabled", 404);
  }

  const user = await requireApiAdminScope("qs:signal:triage");
  if (user instanceof Response) return user;

  const capability = await requireQsCapability(user, "qs_signal_triage");
  if (capability instanceof Response) return capability;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = triageSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const signal = await triageSafeguardSignal({
      signalId: id,
      actorId: user.id,
      actorRole: user.primaryRole,
      organisationId: parsed.data.organisationId,
      input: parsed.data,
    });
    return jsonOk({ signal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to triage signal";
    const status = message.includes("not found") ? 404 : 400;
    return jsonError(message, status);
  }
}

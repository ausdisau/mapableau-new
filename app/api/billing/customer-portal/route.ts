import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import {
  createCustomerPortalSession,
  preferredPortalRoleForUserRole,
} from "@/lib/billing/core/subscription-service";
import type { BillingPortalFlow } from "@/lib/stripe/portal";

const portalRequestSchema = z.object({
  flow: z
    .enum([
      "payment_method_update",
      "subscription_cancel",
      "subscription_update",
    ])
    .optional(),
  subscriptionId: z.string().min(1).max(200).optional(),
});

function portalFlowFromRequest(
  flow: z.infer<typeof portalRequestSchema>["flow"],
  subscriptionId: string | undefined
): BillingPortalFlow | undefined {
  if (!flow) return undefined;
  switch (flow) {
    case "payment_method_update":
      return { type: "payment_method_update" };
    case "subscription_cancel":
      return subscriptionId
        ? { type: "subscription_cancel", subscriptionId }
        : undefined;
    case "subscription_update":
      return subscriptionId
        ? { type: "subscription_update", subscriptionId }
        : undefined;
    default: {
      const _exhaustive: never = flow;
      return _exhaustive;
    }
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const raw = await req.json().catch(() => ({}));
  const parsed = portalRequestSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { flow, subscriptionId } = parsed.data;
  if (
    (flow === "subscription_cancel" || flow === "subscription_update") &&
    !subscriptionId
  ) {
    return jsonError("subscriptionId is required for this portal flow", 400);
  }

  const result = await createCustomerPortalSession(user.id, {
    preferredRole: preferredPortalRoleForUserRole(user.primaryRole),
    flow: portalFlowFromRequest(flow, subscriptionId),
  });
  if (!result.ok) return jsonError(result.error ?? "Portal unavailable", 400);
  return jsonOk({ portalUrl: result.portalUrl });
}

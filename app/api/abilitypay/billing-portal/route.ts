import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAbilityPayBillingPortalSession } from "@/lib/abilitypay/billing-portal-service";
import {
  requireAbilityPayAccess,
  requireAbilityPayPermission,
} from "@/lib/abilitypay/api-helpers";
import { z } from "zod";

const bodySchema = z.object({
  returnPath: z.string().max(500).optional(),
  participantId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const accessDenied = requireAbilityPayAccess(user);
  if (accessDenied) return accessDenied;

  const permissionDenied = requireAbilityPayPermission(
    user,
    "abilitypay:invoice:approve"
  );
  if (permissionDenied) return permissionDenied;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const result = await createAbilityPayBillingPortalSession({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    participantId: body.participantId,
    returnPath: body.returnPath,
  });

  if (!result.ok) {
    const status =
      result.code === "NOT_APPLICABLE"
        ? 400
        : result.code === "STRIPE_NOT_CONFIGURED"
          ? 503
          : 400;
    return jsonError(result.error, status);
  }

  return jsonOk({ portalUrl: result.portalUrl });
}

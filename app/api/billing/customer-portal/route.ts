import type { BillingAccountRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { connectOnboardingSchema } from "@/lib/billing-core/schemas";
import { createCustomerPortalSession } from "@/lib/billing-core/subscription-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => ({}));
  const parsed = connectOnboardingSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const role = (parsed.data.role ?? "provider") as BillingAccountRole;
  const result = await createCustomerPortalSession(
    user.id,
    role,
    parsed.data.returnPath
  );
  if (!result.ok) return jsonError(result.error ?? "Portal unavailable", 400);
  return jsonOk({ portalUrl: result.portalUrl });
}

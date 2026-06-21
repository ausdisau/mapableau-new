import type { BillingAccountRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { refreshConnectOnboardingLink } from "@/lib/billing-core/connect-service";
import { connectOnboardingSchema } from "@/lib/billing-core/schemas";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => ({}));
  const parsed = connectOnboardingSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const role = (parsed.data.role ?? "provider") as BillingAccountRole;
  const result = await refreshConnectOnboardingLink(user.id, role);
  if (!result.ok) return jsonError(result.error ?? "Onboarding link failed", 503);
  return jsonOk({ onboardingUrl: result.onboardingUrl });
}

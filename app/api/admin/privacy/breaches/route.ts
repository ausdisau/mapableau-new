import type { MapAbleUserRole } from "@prisma/client";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createPrivacyBreach,
  listPrivacyBreaches,
} from "@/lib/privacy/breach-register-service";
import { createBreachSchema } from "@/lib/validation/reporting-audit";

export async function GET() {
  const user = await requireApiPermission("privacy:breach:manage");
  if (user instanceof Response) return user;

  const breaches = await listPrivacyBreaches();
  return jsonOk({ breaches });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("privacy:breach:manage");
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createBreachSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const breach = await createPrivacyBreach(
    body,
    user.id,
    user.primaryRole as MapAbleUserRole
  );
  return jsonOk({ breach }, 201);
}

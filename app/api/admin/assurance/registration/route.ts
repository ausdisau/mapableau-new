import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { startDigitalPlatformRegistration } from "@/lib/assurance/registration/digital-platform-registration";
import {
  listRegistrationApplications,
  refreshRegistrationReadiness,
} from "@/lib/assurance/registration/provider-registration-service";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  organisationId: z.string().min(1),
  include0137: z.boolean().optional(),
  additionalGroups: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId") ?? undefined;
  const applications = await listRegistrationApplications(organisationId);
  return jsonOk({
    applications,
    disclaimer: "Registration status is not platform or NDIA production approval.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assurance:registration:manage");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const application = await startDigitalPlatformRegistration({
    organisationId: parsed.data.organisationId,
    include0137: parsed.data.include0137,
    additionalGroups: parsed.data.additionalGroups,
    ownerUserId: user.id,
  });
  const refreshed = await refreshRegistrationReadiness(application.id);
  return jsonOk({ application: refreshed });
}

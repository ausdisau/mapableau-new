import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  domainServicesConfig,
  isDomainServicesSelfServeEnabled,
} from "@/lib/config/domain-services";
import { isSlugAvailable } from "@/lib/tenancy/domain-services-registry";
import { findProviderOrganisationIdForUser } from "@/lib/tenancy/domain-services-setup-service";
import { proposedHostname } from "@/lib/tenancy/domain-services-wizard-model";

const bodySchema = z
  .object({
    slug: z.string().min(1).max(48),
  })
  .strict();

/**
 * Slug check is session-scoped. Host / x-tenant-id never authorise tenancy.
 */
export async function POST(req: Request) {
  if (!isDomainServicesSelfServeEnabled()) {
    return jsonError("DOMAIN_SERVICES_SELF_SERVE_DISABLED", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const { slug } = bodySchema.parse(await req.json());
    const organisationId =
      (await findProviderOrganisationIdForUser(user.id)) ?? undefined;
    const result = isSlugAvailable(slug, { organisationId });
    return jsonOk({
      slug,
      available: result.available,
      reason: result.reason ?? null,
      proposedHostname: proposedHostname(
        slug,
        domainServicesConfig.proposedHostSuffix,
      ),
      note: "Hostname is branding-only. Live DNS / Vercel attach is NOT CONFIGURED.",
    });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Slug check failed", 500);
  }
}

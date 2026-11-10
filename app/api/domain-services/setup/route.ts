import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isDomainServicesSelfServeEnabled } from "@/lib/config/domain-services";
import { DOMAIN_SERVICES_MODULE_KEYS } from "@/lib/tenancy/domain-services-brand";
import {
  loadDomainServicesSetupForActor,
  saveDomainServicesSetup,
} from "@/lib/tenancy/domain-services-setup-service";

const moduleSchema = z.object(
  Object.fromEntries(
    DOMAIN_SERVICES_MODULE_KEYS.map((key) => [key, z.boolean()]),
  ) as Record<(typeof DOMAIN_SERVICES_MODULE_KEYS)[number], z.ZodBoolean>,
);

const setupBodySchema = z
  .object({
    slug: z.string().min(1).max(48),
    brand: z.object({
      companyName: z.string().min(1).max(120),
      tagline: z.string().max(200).default(""),
      logoUrl: z.string().max(500).default(""),
      primaryColor: z.string().max(32).default("#0F4C5C"),
      supportEmail: z.string().max(200).default(""),
      supportPhone: z.string().max(40).default(""),
    }),
    modules: moduleSchema,
  })
  .strict();

/**
 * Domain Services setup is session-scoped only.
 * Host / x-tenant-id / client organisationId are never used as authority.
 */
export async function GET(_req: Request) {
  if (!isDomainServicesSelfServeEnabled()) {
    return jsonError("DOMAIN_SERVICES_SELF_SERVE_DISABLED", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const draft = await loadDomainServicesSetupForActor(user);
    return jsonOk({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    if (message === "DOMAIN_SERVICES_SELF_SERVE_DISABLED") {
      return jsonError(message, 503);
    }
    return jsonError("Load failed", 500);
  }
}

export async function POST(req: Request) {
  if (!isDomainServicesSelfServeEnabled()) {
    return jsonError("DOMAIN_SERVICES_SELF_SERVE_DISABLED", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = setupBodySchema.parse(await req.json());
    const draft = await saveDomainServicesSetup({
      actor: user,
      slug: body.slug,
      brand: body.brand,
      modules: body.modules,
    });
    return jsonOk(
      {
        draft,
        previewPath: `/t/${draft.slug}`,
        domainActivation: draft.domainActivation,
      },
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    const message = error instanceof Error ? error.message : "Setup failed";
    if (message === "DOMAIN_SERVICES_SELF_SERVE_DISABLED") {
      return jsonError(message, 503);
    }
    if (
      message === "SLUG_TAKEN" ||
      message === "SLUG_RESERVED" ||
      message === "SLUG_INVALID" ||
      message === "SLUG_REQUIRED" ||
      message === "COMPANY_REQUIRED" ||
      message === "EMAIL_INVALID" ||
      message === "MODULES_REQUIRED"
    ) {
      return jsonError(message, 400);
    }
    return jsonError("Setup failed", 500);
  }
}

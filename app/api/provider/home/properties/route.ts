import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  createProviderProperty,
  HomeProviderListingsDisabledError,
  listProviderProperties,
} from "@/lib/home-living/discovery/provider-listing-service";

export async function GET(request: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (!homeLivingConfig.enabled || !homeLivingConfig.providerListingsEnabled) {
    return jsonError("Provider home listings are disabled", 404);
  }
  const organisationId = new URL(request.url).searchParams.get(
    "organisationId",
  );
  if (!organisationId) {
    return jsonError("organisationId is required", 400);
  }
  try {
    const properties = await listProviderProperties({
      actorUserId: user.id,
      providerOrganisationId: organisationId,
    });
    return jsonOk({ properties });
  } catch (error) {
    if (error instanceof HomeProviderListingsDisabledError) {
      return jsonError("Provider home listings are disabled", 404);
    }
    if (error instanceof Error && error.message === "ORG_ACCESS_DENIED") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Unable to list properties", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (!homeLivingConfig.enabled || !homeLivingConfig.providerListingsEnabled) {
    return jsonError("Provider home listings are disabled", 404);
  }

  const parsed = z
    .object({
      providerOrganisationId: z.string().min(1),
      title: z.string().min(1).max(200),
      addressSummary: z.string().min(1).max(500),
      propertyType: z.string().min(1).max(100),
      suburb: z.string().max(120).optional(),
      state: z.string().max(50).optional(),
      locationPrecision: z.string().optional(),
      bedroomCount: z.number().int().nonnegative().optional(),
      bathroomCount: z.number().int().nonnegative().optional(),
      sdaCategory: z.string().max(120).optional(),
      rentDisplay: z.string().max(120).optional(),
      virtualTourUrl: z.string().url().optional(),
      tenancyTermsSummary: z.string().max(2000).optional(),
      supportProviderIndependent: z.boolean().optional(),
      relatedSupportOrganisationId: z.string().optional(),
      relatedSupportOrganisationNote: z.string().max(1000).optional(),
    })
    .safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const property = await createProviderProperty({
      actorUserId: user.id,
      ...parsed.data,
    });
    return jsonOk({ property }, 201);
  } catch (error) {
    if (error instanceof HomeProviderListingsDisabledError) {
      return jsonError("Provider home listings are disabled", 404);
    }
    if (error instanceof Error && error.message === "ORG_ACCESS_DENIED") {
      return jsonError("Forbidden", 403);
    }
    if (
      error instanceof Error &&
      error.message === "FORBIDDEN_CLAIM_LANGUAGE"
    ) {
      return jsonError("Unsupported claim language in listing copy", 400);
    }
    return jsonError("Unable to create property", 500);
  }
}

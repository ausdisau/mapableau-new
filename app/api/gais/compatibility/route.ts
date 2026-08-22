import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  accessRequirementsSchema,
  evaluateCompatibility,
  mobilityProfileToAccessRequirements,
  type AccessRequirements,
  type CompatibilityEvaluation,
} from "@/lib/gais/compatibility";
import type { GaisFeature } from "@/lib/gais/contracts/feature";
import { getGaisEvidenceForFeature, getGaisPlace } from "@/lib/gais/service";
import { getMobilityRoutingProfile } from "@/lib/go/profile-service";

const compatibilityRequestSchema = z.object({
  featureId: z.string().optional(),
  placeId: z.string().optional(),
  requirements: accessRequirementsSchema.optional(),
  useStoredProfile: z.boolean().optional(),
});

export type CompatibilityRequestInput = z.infer<typeof compatibilityRequestSchema>;

export type CompatibilityRequestContext = {
  userId: string | null;
  getProfileForUser: (userId: string) => Promise<AccessRequirements | null>;
  loadFeature: (input: {
    featureId?: string;
    placeId?: string;
  }) => Promise<GaisFeature | null>;
};

export type CompatibilityRequestResult =
  | { ok: true; evaluation: CompatibilityEvaluation; requirements: AccessRequirements; feature: GaisFeature }
  | { ok: false; status: number; message: string };

/** Resolves requirements — stored profile is always scoped to the authenticated user. */
export async function resolveAccessRequirements(
  input: CompatibilityRequestInput,
  ctx: CompatibilityRequestContext,
): Promise<
  | { ok: true; requirements: AccessRequirements }
  | { ok: false; status: number; message: string }
> {
  if (input.requirements) {
    return { ok: true, requirements: input.requirements };
  }

  if (input.useStoredProfile) {
    if (!ctx.userId) {
      return {
        ok: false,
        status: 401,
        message: "Authentication required to use stored mobility profile.",
      };
    }

    const profileRequirements = await ctx.getProfileForUser(ctx.userId);
    if (!profileRequirements || Object.keys(profileRequirements).length === 0) {
      return {
        ok: false,
        status: 404,
        message: "No stored mobility routing profile found for this participant.",
      };
    }

    return { ok: true, requirements: profileRequirements };
  }

  return {
    ok: false,
    status: 400,
    message: "Provide explicit requirements or set useStoredProfile with authentication.",
  };
}

export async function handleCompatibilityRequest(
  input: CompatibilityRequestInput,
  ctx: CompatibilityRequestContext,
): Promise<CompatibilityRequestResult> {
  const requirementsResult = await resolveAccessRequirements(input, ctx);
  if (!requirementsResult.ok) {
    return {
      ok: false,
      status: requirementsResult.status,
      message: requirementsResult.message,
    };
  }

  if (!input.featureId && !input.placeId) {
    return {
      ok: false,
      status: 400,
      message: "featureId or placeId is required.",
    };
  }

  const feature = await ctx.loadFeature({
    featureId: input.featureId,
    placeId: input.placeId,
  });

  if (!feature) {
    return { ok: false, status: 404, message: "Feature or place not found." };
  }

  const evaluation = evaluateCompatibility(feature, requirementsResult.requirements);

  return {
    ok: true,
    evaluation,
    requirements: requirementsResult.requirements,
    feature,
  };
}

export async function POST(req: Request) {
  if (!mapableGaisFlags.compatibilityEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_COMPATIBILITY_ENABLED");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = compatibilityRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const input = parsed.data;
  let userId: string | null = null;

  if (input.useStoredProfile) {
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    userId = user.id;
  }

  const result = await handleCompatibilityRequest(input, {
    userId,
    getProfileForUser: async (uid) => {
      const profile = await getMobilityRoutingProfile(uid);
      return profile ? mobilityProfileToAccessRequirements(profile) : null;
    },
    loadFeature: async ({ featureId, placeId }) => {
      if (featureId) {
        return getGaisEvidenceForFeature(featureId);
      }
      if (placeId) {
        const place = await getGaisPlace(placeId);
        return place?.features.find((f) => f.type === "PLACE") ?? null;
      }
      return null;
    },
  });

  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return jsonOk({
    result: result.evaluation.overall,
    evaluation: result.evaluation,
    requirements: result.requirements,
    feature: {
      id: result.feature.id,
      type: result.feature.type,
      name: result.feature.name,
      placeId: result.feature.placeId,
    },
    meta: {
      ...GAIS_RESPONSE_META,
      compatibilityScope: "environmental_facts_vs_user_requirements",
    },
  });
}

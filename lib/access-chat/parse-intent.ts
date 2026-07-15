import { generateObject } from "ai";
import { z } from "zod";

import {
  inferCategoriesFromQuery,
  inferRequiredFeaturesFromQuery,
} from "@/lib/access-chat/feature-map";
import { geocodeIntentLocation } from "@/lib/access-chat/geocode-intent";
import { resolveModelForTask } from "@/lib/ai/modelRouter";
import {
  redactPersonalInformation,
  sanitiseUserContextForModel,
} from "@/lib/ai/privacy";
import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import {
  accessSearchIntentSchema,
  type AccessSearchIntent,
} from "@/types/access-chat";

const llmIntentSchema = z.object({
  query: z.string(),
  suburb: z.string().optional().nullable(),
  radiusMeters: z.number().optional().nullable(),
  categories: z.array(z.string()).optional().nullable(),
  requiredFeatures: z
    .object({
      stepFreeAccess: z.boolean().optional().nullable(),
      accessibleToilet: z.boolean().optional().nullable(),
      accessibleParking: z.boolean().optional().nullable(),
      quietSpace: z.boolean().optional().nullable(),
      hearingLoop: z.boolean().optional().nullable(),
      serviceAnimalFriendly: z.boolean().optional().nullable(),
      lowSensory: z.boolean().optional().nullable(),
      accessibleDropoff: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
  mobilityAid: z
    .enum([
      "manual_wheelchair",
      "powerchair",
      "scooter",
      "walker",
      "cane",
      "none",
    ])
    .optional()
    .nullable(),
  avoidCrowds: z.boolean().optional().nullable(),
  rampTolerance: z.enum(["none", "gentle", "moderate"]).optional().nullable(),
});

const SYSTEM = `You parse natural-language accessibility place search queries for MapAble Access (Australia).
Extract structured search intent. Prefer observed access needs over assumptions.
Categories use snake_case: cafe_restaurant, bar_pub, shop, shopping_centre, park, beach, library, museum_gallery, theatre_cinema, sports_venue, community_centre, health_service, education, transport_station, public_toilet, accommodation, tourism_attraction, government_service, other.
Set requiredFeatures flags only when clearly requested.
Do not invent legal compliance claims. Return JSON only.`;

export type ParseAccessIntentResult = {
  intent: AccessSearchIntent;
  parsed: boolean;
  engineId: string;
};

export async function parseAccessIntent(
  message: string,
  options?: {
    locationHint?: { lat?: number; lng?: number; suburb?: string };
    userContext?: AccessSearchIntent["userContext"];
    shareAccessProfile?: boolean;
  },
): Promise<ParseAccessIntentResult> {
  const safeMessage = redactPersonalInformation(message.trim());
  const consentedContext = sanitiseUserContextForModel(
    options?.userContext,
    Boolean(options?.shareAccessProfile),
  );

  const routed = resolveModelForTask("intent_parse");
  let intent: AccessSearchIntent;
  let engineId = "rules/intent";
  let parsed = false;

  if (!routed) {
    intent = heuristicParse(safeMessage, options?.locationHint, consentedContext);
  } else {
    const startedAt = Date.now();
    try {
      const { object, usage } = await generateObject({
        model: routed.model,
        schema: llmIntentSchema,
        system: SYSTEM,
        prompt: `User message: ${safeMessage}`,
        temperature: 0.1,
      });

      captureLlmGeneration({
        traceName: "access_chat_intent_parse",
        model: routed.engineId,
        provider: getLlmAnalyticsProvider(routed.engineId),
        latencyMs: Date.now() - startedAt,
        success: true,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        totalTokens: usage?.totalTokens,
        metadata: {
          task: "intent_parse",
          fallback_used: routed.fallbackUsed,
          query_length: safeMessage.length,
        },
      });

      intent = normaliseLlmIntent(object, safeMessage, options?.locationHint, consentedContext);
      engineId = routed.engineId;
      parsed = true;
    } catch {
      captureLlmGeneration({
        traceName: "access_chat_intent_parse",
        model: routed.engineId,
        provider: getLlmAnalyticsProvider(routed.engineId),
        latencyMs: Date.now() - startedAt,
        success: false,
        metadata: { task: "intent_parse" },
      });
      intent = heuristicParse(safeMessage, options?.locationHint, consentedContext);
      engineId = `${routed.engineId}/fallback`;
    }
  }

  intent = await geocodeIntentLocation(intent);
  const validated = accessSearchIntentSchema.safeParse(intent);
  return {
    intent: validated.success ? validated.data : intent,
    parsed,
    engineId,
  };
}

function normaliseLlmIntent(
  object: z.infer<typeof llmIntentSchema>,
  message: string,
  locationHint?: { lat?: number; lng?: number; suburb?: string },
  userContext?: AccessSearchIntent["userContext"],
): AccessSearchIntent {
  const required = object.requiredFeatures ?? {};
  const features = {
    stepFreeAccess: required.stepFreeAccess ?? undefined,
    accessibleToilet: required.accessibleToilet ?? undefined,
    accessibleParking: required.accessibleParking ?? undefined,
    quietSpace: required.quietSpace ?? undefined,
    hearingLoop: required.hearingLoop ?? undefined,
    serviceAnimalFriendly: required.serviceAnimalFriendly ?? undefined,
    lowSensory: required.lowSensory ?? undefined,
    accessibleDropoff: required.accessibleDropoff ?? undefined,
  };

  const heuristicFeatures = inferRequiredFeaturesFromQuery(message);
  const mergedFeatures = { ...heuristicFeatures, ...stripNulls(features) };

  const suburb = object.suburb?.trim() || locationHint?.suburb;
  const categories =
    object.categories?.filter(Boolean) ?? inferCategoriesFromQuery(message);

  return {
    query: object.query?.trim() || message,
    location: suburb
      ? {
          suburb,
          lat: locationHint?.lat,
          lng: locationHint?.lng,
          radiusMeters: object.radiusMeters ?? 3000,
        }
      : locationHint?.lat != null && locationHint?.lng != null
        ? {
            lat: locationHint.lat,
            lng: locationHint.lng,
            radiusMeters: object.radiusMeters ?? 3000,
          }
        : undefined,
    categories: categories.length ? categories : undefined,
    requiredFeatures: mergedFeatures,
    userContext: {
      ...userContext,
      mobilityAid: object.mobilityAid ?? userContext?.mobilityAid,
      avoidCrowds: object.avoidCrowds ?? userContext?.avoidCrowds,
      rampTolerance: object.rampTolerance ?? userContext?.rampTolerance,
    },
  };
}

function heuristicParse(
  message: string,
  locationHint?: { lat?: number; lng?: number; suburb?: string },
  userContext?: AccessSearchIntent["userContext"],
): AccessSearchIntent {
  const suburbMatch =
    message.match(/\bnear\s+([A-Za-z][A-Za-z\s'-]{1,40})/i) ??
    message.match(/\bin\s+([A-Za-z][A-Za-z\s'-]{1,40})/i);
  let suburb = locationHint?.suburb;
  if (suburbMatch?.[1]) {
    suburb = suburbMatch[1]
      .replace(/\bwith\b.*$/i, "")
      .replace(/\bthat\b.*$/i, "")
      .trim();
  }

  const verifiedMonth = /verified (this|last) month/i.test(message);

  return {
    query: message,
    location: suburb
      ? {
          suburb,
          lat: locationHint?.lat,
          lng: locationHint?.lng,
          radiusMeters: 3000,
        }
      : locationHint?.lat != null && locationHint?.lng != null
        ? {
            lat: locationHint.lat,
            lng: locationHint.lng,
            radiusMeters: 3000,
          }
        : undefined,
    categories: inferCategoriesFromQuery(message),
    requiredFeatures: inferRequiredFeaturesFromQuery(message),
    userContext: {
      ...userContext,
      avoidCrowds:
        userContext?.avoidCrowds ??
        (/quiet|crowd|busy|sensory/i.test(message) ? true : undefined),
      mobilityAid:
        userContext?.mobilityAid ??
        (/power\s?chair|powerchair/i.test(message)
          ? "powerchair"
          : /manual\s?wheelchair|wheelchair/i.test(message)
            ? "manual_wheelchair"
            : /scooter/i.test(message)
              ? "scooter"
              : undefined),
    },
    // verifiedMonth reserved for ranker soft boost via query text
    ...(verifiedMonth ? {} : {}),
  };
}

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  buildProviderSearchFilters,
  lookupMatchingProviderRecords,
  parseProviderChatIntent,
} from "@/lib/provider/finder/provider-chat-matching";
import { PROVIDER_SERVICE_CATALOG, PROVIDER_SERVICE_IDS } from "@/lib/provider/finder/search-service-catalog";
import { isProviderSearchProfileEnabled } from "@/lib/provider/finder/search-profile-contract";
import { readProviderSearchProfile } from "@/lib/provider/finder/search-profile-service";
import { createBrowserChatContext, mergeFollowUpFilters, providerChatContextSchema } from "@/lib/provider/finder/provider-chat-session";
import { isSameOriginMutation } from "@/lib/provider/finder/same-origin";

export const runtime = "nodejs";
export const maxDuration = 30;

const transientSchema = z.object({
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  service: z.string().max(100).optional(),
  communication: z.enum(["AAC", "Text", "Auslan", "No preference"]).optional(),
  usePreferences: z.boolean().default(false),
}).strict();

const requestSchema = z.object({
  message: z.string().trim().min(2).max(500),
  useSavedProfile: z.boolean().default(false),
  preferences: transientSchema.optional(),
  previous: providerChatContextSchema.optional(),
}).strict();

const noStore = { "Cache-Control": "no-store" };

function getTransientServiceId(service?: string) {
  if (!service) return undefined;
  return PROVIDER_SERVICE_IDS.find((id) => {
    const item = PROVIDER_SERVICE_CATALOG[id];
    return service === id || item.label.toLowerCase() === service.toLowerCase();
  });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Origin not allowed" }, { status: 403, headers: noStore });
  }
  if (!checkIpRateLimit("provider-chat:" + user.id + ":" + getClientIp(request), { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Too many searches" }, { status: 429, headers: noStore });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400, headers: noStore }); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid search request" }, { status: 400, headers: noStore });
  }

  const { message, useSavedProfile, preferences, previous } = parsed.data;
  if (useSavedProfile && !isProviderSearchProfileEnabled()) {
    return Response.json({ error: "Saved profiles are not enabled" }, { status: 503, headers: noStore });
  }

  let saved = null;
  if (useSavedProfile) {
    try {
      const profile = await readProviderSearchProfile(user.id);
      if (!profile) {
        return Response.json({ error: "Save and consent to a profile before using it" }, { status: 409, headers: noStore });
      }
      saved = profile.preferences;
    } catch {
      return Response.json({ error: "Saved profile cannot be read" }, { status: 503, headers: noStore });
    }
  }

  const intent = parseProviderChatIntent(message);
  if (intent.unresolvedLocation) {
    return Response.json({ error: "Precise location is not enabled. Enter a suburb or postcode; MapAble will not infer your current location." }, { status: 422, headers: noStore });
  }
  const transient = preferences?.usePreferences ? {
    state: preferences.state,
    postcode: preferences.postcode,
    serviceType: getTransientServiceId(preferences.service),
    communication: preferences.communication === "No preference" ? undefined : preferences.communication,
  } : undefined;
  const currentFilters = buildProviderSearchFilters({
    intent, saved, transient, usedSavedProfile: useSavedProfile,
  });
  const { filters, offset } = mergeFollowUpFilters({
    current: currentFilters,
    intent,
    previous,
    message,
    hasTemporaryLocation: Boolean(transient?.state || transient?.postcode),
    hasTemporaryService: Boolean(transient?.serviceType),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        emit({ type: "status", text: "Searching imported provider classifications…" });
        const { results, hasMore } = await lookupMatchingProviderRecords(filters, 12, offset);
        const workerBoundary = intent.workerIntent
          ? "Individual workers are not returned because this dataset contains provider organisations, not consented public worker profiles. Individual worker-screening status must be checked through an authorised NDIS Worker Screening Database pathway. "
          : "";

        const scope = filters.suburb ? "in the selected suburb" : filters.postcode
          ? "in the selected postcode" : filters.state ? "in the selected state" : "across the available directory";
        let summary = results.length
          ? "Found " + results.length + " provider records " + scope + " matching the available directory categories."
          : "No provider records matched the supplied directory filters.";

        if (hasMore) summary += " More records may match; say Show more to see the next page.";
        if (filters.communicationModes.length || filters.functionalRequirements.length || filters.delivery !== "any" || filters.fundingManagement !== "unspecified") {
          summary += " Functional access, communication, delivery, funding suitability and availability still need individual confirmation.";
        }
        if (filters.suburb) summary += " Suburb search is not a distance or service-area search.";
        emit({ type: "message", text: workerBoundary + summary });

        emit({
          type: "context",
          applied: {
            state: filters.state ?? null,
            postcode: filters.postcode ?? null,
            suburb: filters.suburb ?? null,
            serviceTypes: filters.serviceTypes,
          },
          personalised: useSavedProfile,
          note: "Profile attributes are used only when explicitly selected. They are not disclosed to providers.",
          unknownFit: ["worker_screening", "current_registration", "availability", "communication_access", "funding_eligibility"],
        });

        for (const row of results) {
          emit({
            type: "provider",
            provider: {
              id: row.source_id,
              name: row.provider_name,
              suburb: row.suburb,
              state: row.state,
              postcode: row.postcode,
              services: row.services,
              registrationGroups: row.registration_groups,
              latitude: row.latitude,
              longitude: row.longitude,
              sourceUpdatedAt: row.updated_at,
              evidence: "Local imported NDIS provider directory record; registration not independently rechecked",
              workerScreening: "Not independently verified",
              fitExplanation: "Directory service category / location match. Personal access and availability require confirmation.",
            },
          });
        }
        emit({
          type: "complete",
          count: results.length,
          hasMore,
          // User-held filter-only state; it is neither credential nor durable chat history.
          nextContext: createBrowserChatContext(filters, offset, results.length, hasMore),
        });
      } catch {
        emit({ type: "error", text: "Search unavailable. No results were verified." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

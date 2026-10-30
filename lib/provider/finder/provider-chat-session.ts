import { z } from "zod";

import {
  PROVIDER_SERVICE_IDS,
  type ProviderServiceId,
} from "./search-service-catalog";
import type {
  ProviderChatIntent,
  ProviderSearchFilters,
} from "./provider-chat-matching";

/** Minimal, non-secret, browser-held search state. No raw prompts, medical notes,
 * names of workers, profile values, personal identifiers or chat transcripts.
 * The server never uses this object as authentication or authorisation.
 */
export const providerChatContextSchema = z.object({
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  suburb: z.string().trim().min(2).max(50).optional(),
  serviceTypes: z.array(z.enum(PROVIDER_SERVICE_IDS)).max(5).default([]),
  providerName: z.string().max(60).optional(),
  nextOffset: z.number().int().min(0).max(240).default(0),
  fromSavedProfile: z.boolean().default(false),
}).strict();

export type ProviderChatContext = z.infer<typeof providerChatContextSchema>;

export function isNextPageMessage(message: string) {
  return /^(?:show\s+more(?:\s+results)?|more(?:\s+results)?|next(?:\s+page)?|continue)$/i.test(message.trim());
}

export function mergeFollowUpFilters(args: {
  current: ProviderSearchFilters;
  intent: ProviderChatIntent;
  previous?: ProviderChatContext;
  message: string;
  hasTemporaryLocation: boolean;
  hasTemporaryService: boolean;
}): { filters: ProviderSearchFilters; offset: number } {
  const { current, previous, intent, message } = args;
  if (!previous) return { filters: current, offset: 0 };
  // An old saved profile is not a standing grant to reuse private preferences.
  if (previous.fromSavedProfile && !current.usedSavedProfile) {
    return { filters: current, offset: 0 };
  }
  const nextPage = isNextPageMessage(message);
  const newLocation = Boolean(intent.state || intent.postcode || intent.suburb || args.hasTemporaryLocation);
  const newService = Boolean(intent.serviceType || args.hasTemporaryService);
  const startNew = /^(?:start over|new search|clear search)$/i.test(message.trim());

  if (startNew) return { filters: { ...current, state: undefined, postcode: undefined, suburb: undefined, serviceTypes: [] }, offset: 0 };
  const serviceTypes: ProviderServiceId[] =
    /\b(?:any service|all services)\b/i.test(message) ? [] :
    newService || current.usedSavedProfile ? current.serviceTypes :
    previous.serviceTypes;

  const filters: ProviderSearchFilters = {
    ...current,
    state: newLocation || current.usedSavedProfile ? current.state : previous.state,
    postcode: newLocation || current.usedSavedProfile ? current.postcode : previous.postcode,
    suburb: newLocation || current.usedSavedProfile ? current.suburb : previous.suburb,
    providerName: intent.providerName ?? (newLocation || newService ? undefined : previous.providerName),
    serviceTypes,
  };
  return { filters, offset: nextPage && !newLocation && !newService ? previous.nextOffset : 0 };
}

export function createBrowserChatContext(
  filters: ProviderSearchFilters,
  offset: number,
  returned: number,
  hasMore: boolean,
): ProviderChatContext {
  return {
    state: filters.state as ProviderChatContext["state"],
    postcode: filters.postcode,
    suburb: filters.suburb,
    serviceTypes: filters.serviceTypes,
    providerName: filters.providerName,
    nextOffset: hasMore ? Math.min(240, offset + returned) : 0,
    fromSavedProfile: filters.usedSavedProfile,
  };
}

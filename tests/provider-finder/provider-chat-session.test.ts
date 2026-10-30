import { describe, expect, it } from "vitest";

import {
  createBrowserChatContext,
  isNextPageMessage,
  mergeFollowUpFilters,
  providerChatContextSchema,
} from "@/lib/provider/finder/provider-chat-session";
import { buildProviderSearchFilters, parseProviderChatIntent } from "@/lib/provider/finder/provider-chat-matching";

const prior = providerChatContextSchema.parse({
  state: "NSW",
  postcode: "2075",
  serviceTypes: ["support_coordination"],
  nextOffset: 12,
  fromSavedProfile: false,
});

describe("bounded multi-turn provider search", () => {
  it("inherits location when user changes just the service", () => {
    const intent = parseProviderChatIntent("What about support workers?");
    const current = buildProviderSearchFilters({ intent, usedSavedProfile: false });
    const next = mergeFollowUpFilters({
      current, intent, previous: prior, message: "What about support workers?",
      hasTemporaryLocation: false, hasTemporaryService: false,
    });
    expect(next.filters.state).toBe("NSW");
    expect(next.filters.postcode).toBe("2075");
    expect(next.filters.serviceTypes).toEqual(["daily_life"]);
    expect(next.offset).toBe(0);
  });

  it("paginates the same query on Show more", () => {
    const message = "Show more";
    const intent = parseProviderChatIntent(message);
    const current = buildProviderSearchFilters({ intent, usedSavedProfile: false });
    const next = mergeFollowUpFilters({
      current, intent, previous: prior, message,
      hasTemporaryLocation: false, hasTemporaryService: false,
    });
    expect(isNextPageMessage(message)).toBe(true);
    expect(next.filters.serviceTypes).toEqual(["support_coordination"]);
    expect(next.offset).toBe(12);
  });

  it("clears previous postcode on explicit different state", () => {
    const message = "What about support coordination in VIC?";
    const intent = parseProviderChatIntent(message);
    const current = buildProviderSearchFilters({ intent, usedSavedProfile: false });
    const next = mergeFollowUpFilters({
      current, intent, previous: prior, message,
      hasTemporaryLocation: false, hasTemporaryService: false,
    });
    expect(next.filters.state).toBe("VIC");
    expect(next.filters.postcode).toBeUndefined();
    expect(next.offset).toBe(0);
  });

  it("does not silently reuse a previously consented saved profile", () => {
    const previouslyPrivate = { ...prior, fromSavedProfile: true };
    const message = "Show more";
    const intent = parseProviderChatIntent(message);
    const current = buildProviderSearchFilters({ intent, usedSavedProfile: false });
    const next = mergeFollowUpFilters({
      current, intent, previous: previouslyPrivate, message,
      hasTemporaryLocation: false, hasTemporaryService: false,
    });
    expect(next.filters.state).toBeUndefined();
    expect(next.offset).toBe(0);
  });

  it("never accepts a previous context with raw text or personal identifiers", () => {
    expect(providerChatContextSchema.safeParse({
      ...prior,
      transcript: ["medical information"],
    }).success).toBe(false);
    expect(providerChatContextSchema.safeParse({
      ...prior,
      participantId: "user-b",
    }).success).toBe(false);
    expect(providerChatContextSchema.safeParse({
      ...prior,
      nextOffset: 10000000,
    }).success).toBe(false);
  });

  it("advances only by actual results and caps the pagination offset", () => {
    const filters = buildProviderSearchFilters({
      intent: parseProviderChatIntent("Find support workers in NSW"),
      usedSavedProfile: false,
    });
    const next = createBrowserChatContext(filters, 12, 12, true);
    expect(next.nextOffset).toBe(24);
    expect(createBrowserChatContext(filters, 240, 12, true).nextOffset).toBe(240);
    expect(createBrowserChatContext(filters, 24, 4, false).nextOffset).toBe(0);
  });
});

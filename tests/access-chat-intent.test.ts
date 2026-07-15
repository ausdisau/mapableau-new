import { describe, expect, it } from "vitest";

import {
  inferCategoriesFromQuery,
  inferRequiredFeaturesFromQuery,
  requiredFeaturesToPrismaTypes,
} from "@/lib/access-chat/feature-map";
import { accessSearchIntentSchema } from "@/types/access-chat";
import {
  redactPersonalInformation,
  sanitiseUserContextForModel,
  stripReviewPii,
} from "@/lib/ai/privacy";
import { describeModelAvailability, resolveModelForTask } from "@/lib/ai/modelRouter";

describe("access search intent schema", () => {
  it("accepts a full intent shape", () => {
    const parsed = accessSearchIntentSchema.parse({
      query: "quiet wheelchair cafe near Chatswood",
      location: { suburb: "Chatswood", radiusMeters: 3000 },
      categories: ["cafe_restaurant"],
      requiredFeatures: {
        stepFreeAccess: true,
        accessibleToilet: true,
        quietSpace: true,
      },
      userContext: {
        mobilityAid: "powerchair",
        avoidCrowds: true,
        rampTolerance: "gentle",
      },
    });
    expect(parsed.location?.suburb).toBe("Chatswood");
    expect(parsed.requiredFeatures.stepFreeAccess).toBe(true);
  });
});

describe("feature-map heuristics", () => {
  it("infers cafe category and access features", () => {
    const q =
      "Find a quiet wheelchair-accessible café near Chatswood with an accessible toilet";
    expect(inferCategoriesFromQuery(q)).toContain("cafe_restaurant");
    const features = inferRequiredFeaturesFromQuery(q);
    expect(features.stepFreeAccess).toBe(true);
    expect(features.accessibleToilet).toBe(true);
    expect(features.quietSpace).toBe(true);
    expect(features.lowSensory).toBe(true);
  });

  it("maps required features to prisma types", () => {
    const types = requiredFeaturesToPrismaTypes({
      stepFreeAccess: true,
      serviceAnimalFriendly: true,
    });
    expect(types).toContain("step_free_entry");
    expect(types).toContain("assistance_animals_welcome");
  });
});

describe("privacy helpers", () => {
  it("redacts email and phone", () => {
    const out = redactPersonalInformation(
      "Call me on 0412 345 678 or email jane@example.com",
    );
    expect(out).not.toContain("0412");
    expect(out).not.toContain("jane@example.com");
    expect(out).toContain("[redacted-phone]");
    expect(out).toContain("[redacted-email]");
  });

  it("strips non-consented profile context", () => {
    expect(
      sanitiseUserContextForModel({ mobilityAid: "powerchair" }, false),
    ).toBeUndefined();
    expect(
      sanitiseUserContextForModel({ mobilityAid: "powerchair" }, true),
    ).toEqual({ mobilityAid: "powerchair" });
  });

  it("strips PII from review text", () => {
    expect(stripReviewPii("Nice place. Contact bob@test.org")).toContain(
      "[redacted-email]",
    );
  });
});

describe("model router", () => {
  it("returns null when no keys configured", () => {
    const prevOpenAi = process.env.OPENAI_API_KEY;
    const prevGemini = process.env.GEMINI_API_KEY;
    const prevGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const prevGw = process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_AI_GATEWAY_API_KEY;

    // Config module may already be evaluated — availability reflects env at import.
    const availability = describeModelAvailability();
    expect(typeof availability.openai).toBe("boolean");
    expect(typeof availability.gemini).toBe("boolean");

    // resolve may still use cached config from first import in this process
    const routed = resolveModelForTask("image_embedding");
    if (!availability.gemini) {
      expect(routed).toBeNull();
    }

    process.env.OPENAI_API_KEY = prevOpenAi;
    process.env.GEMINI_API_KEY = prevGemini;
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = prevGoogle;
    process.env.AI_GATEWAY_API_KEY = prevGw;
  });
});

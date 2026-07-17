import type { AccessibilityProfileSource } from "@/lib/communications-os/projection";

/**
 * Synthetic Taylor fixture for Connected Capability golden scenario.
 * Labelled synthetic — not real participant data.
 */
export const TAYLOR_FIXTURE_ID = "fixture-taylor-participant";

export const taylorAccessibilityProfile: AccessibilityProfileSource = {
  id: "fixture-taylor-accessibility-profile",
  userId: TAYLOR_FIXTURE_ID,
  communicationPreferences: ["plain_language", "aac", "written_only"],
  cognitivePreferences: {
    oneQuestionAtATime: true,
    responseTimeMinimumSeconds: 20,
    plainLanguage: true,
    communicationInstructions: [
      "Use written and spoken instructions together.",
      "Ask one question at a time and wait for my AAC reply.",
      "Do not rush. Give me at least 20 seconds.",
    ],
  },
  sensoryPreferences: {},
  digitalPreferences: {
    oneQuestionAtATime: true,
  },
  updatedAt: "2026-07-17T00:00:00.000Z",
};

export const taylorGoal = {
  statement: "Complete first-day workplace induction at Harbour Civic Centre.",
  requirements: [
    "written and spoken instructions",
    "one question at a time",
    "minimum response time",
    "power-chair compatible transport",
    "charged communication device",
    "support worker familiar with AAC",
    "step-free door-to-room journey",
  ],
  isSynthetic: true as const,
};

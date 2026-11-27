import { afterEach, describe, expect, it, vi } from "vitest";

import { isInterviewJourneyPreviewAvailable } from "@/lib/config/starting-work-pilot";
import {
  buildInterviewHandoffReceipt,
  interviewJourneyFixture,
} from "@/lib/pilot/starting-work/interview-journey-fixture";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("interview journey availability", () => {
  it("denies by default (fail-closed)", () => {
    expect(isInterviewJourneyPreviewAvailable({})).toBe(false);
  });

  it("allows local/CI when pilot and synthetic-only are on", () => {
    expect(
      isInterviewJourneyPreviewAvailable({
        MAPABLE_STARTING_WORK_PILOT_ENABLED: "true",
        MAPABLE_STARTING_WORK_SYNTHETIC_ONLY: "true",
      }),
    ).toBe(true);
  });

  it("allows Vercel preview", () => {
    expect(
      isInterviewJourneyPreviewAvailable({
        MAPABLE_STARTING_WORK_PILOT_ENABLED: "true",
        VERCEL: "1",
        VERCEL_ENV: "preview",
      }),
    ).toBe(true);
  });

  it("404s production and non-synthetic posture", () => {
    expect(
      isInterviewJourneyPreviewAvailable({
        MAPABLE_STARTING_WORK_PILOT_ENABLED: "true",
        VERCEL: "1",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
    expect(
      isInterviewJourneyPreviewAvailable({
        MAPABLE_STARTING_WORK_PILOT_ENABLED: "true",
        MAPABLE_STARTING_WORK_SYNTHETIC_ONLY: "false",
      }),
    ).toBe(false);
  });
});

describe("interview journey fixture", () => {
  it("stays synthetic with booking/payment/dispatch denied", () => {
    expect(interviewJourneyFixture.productionClaim).toBe("none");
    expect(interviewJourneyFixture.bookingPaymentDispatch).toBe(false);
  });

  it("aligns with worker_cancellation golden journey honesty", () => {
    const state = runGoldenJourney({ failureMode: "worker_cancellation" });
    expect(state.blocked).toBe(true);
    expect(state.failureMode).toBe("worker_cancellation");
    expect(interviewJourneyFixture.transportStatus).toBe("on_hold");
  });

  it("builds handoff receipt without implicit field opt-ins", () => {
    const receipt = buildInterviewHandoffReceipt({
      confirmedMeaning: null,
      addedMessage: "extra",
      pickupPreference: "ask_different",
      selectedFieldIds: [],
    });
    expect(receipt.message).toMatch(/help me recover/i);
    expect(receipt.selectedFieldIds).toEqual([]);
  });

  it("includes only explicitly selected fields", () => {
    const receipt = buildInterviewHandoffReceipt({
      confirmedMeaning: "Confirmed support before interview",
      addedMessage: "AAC note",
      pickupPreference: "keep_on_hold",
      selectedFieldIds: ["original_words", "added_message", "bogus"],
    });
    expect(receipt.message).toBe("Confirmed support before interview");
    expect(receipt.selectedFieldIds).toEqual(["original_words", "added_message"]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getMapAbleActionDefinition,
  isMapAbleActionKey,
  listMapAbleActionDefinitions,
  MAPABLE_ACTION_KEYS,
  missionActionTypeToKernelKey,
} from "@/lib/ai/platform/actions/registry";

describe("Action registry", () => {
  it("registers exactly the five Phase 02 action types", () => {
    expect(MAPABLE_ACTION_KEYS).toEqual([
      "save_participant_preference",
      "request_human_coordination",
      "submit_care_request",
      "submit_transport_request",
      "send_provider_message",
    ]);
    expect(listMapAbleActionDefinitions()).toHaveLength(5);
  });

  it("does not register worker assignment, payment, or disclosure actions", () => {
    expect(isMapAbleActionKey("assign_support_worker")).toBe(false);
    expect(isMapAbleActionKey("confirm_transport")).toBe(false);
    expect(isMapAbleActionKey("approve_or_pay_invoice")).toBe(false);
    expect(isMapAbleActionKey("disclose_disability")).toBe(false);
  });

  it("labels outcomes as requests/submissions not bookings", () => {
    expect(getMapAbleActionDefinition("submit_transport_request").successOutcomeLabel).toBe(
      "Transport request submitted",
    );
    expect(getMapAbleActionDefinition("submit_care_request").successOutcomeLabel).toBe(
      "Care request submitted",
    );
  });

  it("maps Mission Runtime prepare_* types to kernel keys", () => {
    expect(missionActionTypeToKernelKey("prepare_transport_request")).toBe(
      "submit_transport_request",
    );
    expect(missionActionTypeToKernelKey("prepare_care_request")).toBe(
      "submit_care_request",
    );
    expect(missionActionTypeToKernelKey("request_human_coordination")).toBe(
      "request_human_coordination",
    );
  });
});

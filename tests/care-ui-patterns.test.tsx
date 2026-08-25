import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SUPPORT_TYPE_OPTIONS,
  supportTypeLabel,
} from "@/components/care/SupportTypeChips";
import { transformCareSupport } from "@/server/agents/careSupportTransformer";

const carePlanDraftReviewSource = readFileSync(
  join(process.cwd(), "components/care/CarePlanDraftReview.tsx"),
  "utf8"
);
const careRequestWizardSource = readFileSync(
  join(process.cwd(), "components/care/CareRequestWizard.tsx"),
  "utf8"
);
const careBookingsSource = readFileSync(
  join(process.cwd(), "app/care/bookings/page.tsx"),
  "utf8"
);
const bookingJourneySource = readFileSync(
  join(process.cwd(), "components/care/BookingJourneyOverview.tsx"),
  "utf8"
);
const supportRecordsSource = readFileSync(
  join(process.cwd(), "app/care/service-logs/page.tsx"),
  "utf8"
);
const serviceLogActionsSource = readFileSync(
  join(process.cwd(), "components/care/ServiceLogConfirmDispute.tsx"),
  "utf8"
);

describe("Care UI patterns — support type chips", () => {
  it("exposes human labels for all care request types (not raw enum strings)", () => {
    for (const option of SUPPORT_TYPE_OPTIONS) {
      expect(option.label).not.toMatch(/personal_care|domestic_assistance/);
      expect(supportTypeLabel(option.value)).toBe(option.label);
    }
    expect(supportTypeLabel("personal_care")).toBe("Personal care");
  });

  it("wizard uses SupportTypeChips instead of raw enum select", () => {
    expect(careRequestWizardSource).toContain("SupportTypeChips");
    expect(careRequestWizardSource).not.toMatch(
      /<select[^>]*name=["']requestType/i
    );
    expect(careRequestWizardSource).not.toMatch(/paste.*tasks.*json/i);
    expect(careRequestWizardSource).not.toContain("tasksJson");
  });
});

describe("Care UI patterns — draft review confirmation", () => {
  it("transformer blocks booking until participant confirmation", () => {
    const output = transformCareSupport({
      sessionId: "ui-test-session",
      message:
        "I need help with showering and dressing on Tuesday morning in Parramatta.",
      assessmentSignals: {},
      preferences: {},
    });
    expect(output.carePlanDraft.bookingStatus).toBe(
      "blocked_until_participant_confirmation"
    );
    expect(output.guardrailDecision.autoFinalizeBooking).toBe(false);
    expect(output.guardrailDecision.autoAssignWorkers).toBe(false);
  });

  it("draft review UI states nothing is booked until confirm", () => {
    expect(carePlanDraftReviewSource).toMatch(
      /nothing is booked and no worker is assigned until you confirm/i
    );
    expect(carePlanDraftReviewSource).toContain("Confirm and save request");
  });
});


describe("Care UI patterns — participant-owned booking journey", () => {
  it("collects timing, recurrence and communication preferences", () => {
    expect(careRequestWizardSource).toContain("care-preferred-date");
    expect(careRequestWizardSource).toContain("recurrencePlaceholder");
    expect(careRequestWizardSource).toContain("communicationNotes");
    expect(careRequestWizardSource).toMatch(
      /No repeating schedule will be created until\s+I agree to the pattern/i
    );
  });

  it("keeps consequential booking decisions confirmation-gated", () => {
    expect(careBookingsSource).toContain("BookingJourneyOverview");
    expect(bookingJourneySource).toMatch(
      /nothing is booked or assigned until the\s+required confirmation is complete/i
    );
    expect(bookingJourneySource).toMatch(
      /Review any proposed provider and price before a booking is confirmed/i
    );
  });
});

describe("Care UI patterns — support record review", () => {
  it("provides an actionable empty state", () => {
    expect(supportRecordsSource).toContain("No support records yet");
    expect(supportRecordsSource).toContain("View your bookings");
    expect(supportRecordsSource).toContain("Request support");
  });

  it("uses plain-language approval and dispute controls", () => {
    expect(serviceLogActionsSource).toContain("Approve record");
    expect(serviceLogActionsSource).toContain("Raise a concern");
    expect(serviceLogActionsSource).toMatch(
      /does not approve NDIS funding, payment or a future booking/i
    );
    expect(serviceLogActionsSource).toContain('aria-live="polite"');
  });
});

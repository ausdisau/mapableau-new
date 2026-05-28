import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiPermission: vi.fn(async () => ({
    id: "provider-user-1",
    primaryRole: "provider_admin",
  })),
}));

vi.mock("@/lib/care/shift-creator/shift-creator-stream-service", () => ({
  runShiftCreatorStream: vi.fn(async ({ onEvent }) => {
    await onEvent?.({
      stage: "received_query",
      message: "Received your shift request.",
    });
    return {
      draft: {
        careBookingId: "booking-1",
        careRequestId: "req-1",
        organisationId: "org-1",
        bookingTitle: "Morning care",
        workerProfileId: "wp-1",
        workerDisplayName: "Sam",
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        eligibility: { ok: true },
      },
      warnings: [],
      suggestedActions: ["Confirm to assign worker and create the shift"],
    };
  }),
}));

import { POST } from "@/app/api/care/shifts/create/stream/route";

describe("POST /api/care/shifts/create/stream", () => {
  it("streams progress and result events", async () => {
    const response = await POST(
      new Request("http://localhost/api/care/shifts/create/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Schedule Sam for Tuesday 9am",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("event: progress");
    expect(text).toContain("event: result");
    expect(text).toContain("Morning care");
  });

  it("returns 400 when query is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/care/shifts/create/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: " " }),
      }),
    );
    expect(response.status).toBe(400);
  });
});

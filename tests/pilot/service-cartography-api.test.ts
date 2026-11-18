import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const auditMock = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => auditMock(...args),
}));

import { GET, POST } from "@/app/api/pilot/service-cartography/route";
import { GET as simulateGet } from "@/app/api/pilot/service-cartography/simulate/route";

const api = "http://localhost:3000/api/pilot/service-cartography";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", "true");
  vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY", "true");
  requireApiSession.mockResolvedValue({
    id: "participant-A",
    primaryRole: "participant",
    roles: ["participant"],
  });
  auditMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Service Cartography pilot API", () => {
  it("returns 503 when the flag is off", async () => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", "false");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not enabled/i);
  });

  it("exposes honesty fields and prohibitions when enabled", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.productionClaim).toBe("not_claimable");
    expect(body.isLiveMatchingEngine).toBe(false);
    expect(body.isBookingEngine).toBe(false);
    expect(body.autoAssignment).toBe(false);
    expect(body.prohibitions).toEqual(
      expect.arrayContaining(["no_booking", "no_ndis_claim", "no_auto_assignment"]),
    );
  });

  it("rejects unauthenticated POST callers", async () => {
    requireApiSession.mockResolvedValue(
      Response.json({ error: "Unauthorized" }, { status: 401 }),
    );
    const res = await POST(
      new Request(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("runs the authenticated golden slice without booking", async () => {
    const res = await POST(
      new Request(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state.matching.ranked).toHaveLength(2);
    expect(body.state.isBooking).toBe(false);
    expect(body.isBookingEngine).toBe(false);
    expect(auditMock).toHaveBeenCalled();
  });

  it("simulates a no-match failure without authentication", async () => {
    const res = await simulateGet(
      new Request(`${api}/simulate?failureMode=no_match`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state.blocked).toBe(true);
    expect(body.state.matching.status).toBe("no_verified_match");
    expect(body.synthetic).toBe(true);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("disables simulate when synthetic-only is turned off", async () => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY", "false");
    const res = await simulateGet(new Request(`${api}/simulate`));
    expect(res.status).toBe(503);
  });
});

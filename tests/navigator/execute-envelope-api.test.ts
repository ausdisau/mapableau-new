import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/config/navigator-pilot", () => ({
  isNavigatorProviderSearchPilotEnabled: vi.fn(() => true),
  assertNavigatorPilotEnabled: vi.fn(),
}));

vi.mock("@/lib/navigator/pilot/execute-envelope", () => ({
  executeNavigatorEnvelope: vi.fn(),
}));

vi.mock("@/intelligence/actions/governed-envelope", () => ({
  approveGovernedActionEnvelope: vi.fn(),
}));

import { POST as approvePost } from "@/app/api/navigator/action-envelopes/[id]/approve/route";
import { POST as executePost } from "@/app/api/navigator/action-envelopes/[id]/execute/route";
import { approveGovernedActionEnvelope } from "@/intelligence/actions/governed-envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";
import { executeNavigatorEnvelope } from "@/lib/navigator/pilot/execute-envelope";

describe("Navigator envelope approve/execute APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNavigatorProviderSearchPilotEnabled).mockReturnValue(true);
  });

  it("returns 401 when unauthenticated on execute", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await executePost(
      new Request("http://localhost/api/navigator/action-envelopes/e1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: "n1", confirmed: true, tenantId: "t1" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when pilot flag is off", async () => {
    vi.mocked(isNavigatorProviderSearchPilotEnabled).mockReturnValue(false);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "participant",
      roles: ["participant"],
    } as never);

    const res = await executePost(
      new Request("http://localhost/api/navigator/action-envelopes/e1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: "n1", confirmed: true }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("approves envelope for authenticated participant", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "participant",
      roles: ["participant"],
    } as never);
    vi.mocked(approveGovernedActionEnvelope).mockResolvedValue({
      id: "e1",
      status: "approved",
    } as never);

    const res = await approvePost(
      new Request("http://localhost/api/navigator/action-envelopes/e1/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: "t1", reason: "looks good" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(res.status).toBe(200);
    expect(approveGovernedActionEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        envelopeId: "e1",
        approverUserId: "u1",
        participantId: "u1",
        tenantId: "t1",
      }),
    );
  });

  it("executes approved envelope and returns result", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "participant",
      roles: ["participant"],
    } as never);
    vi.mocked(executeNavigatorEnvelope).mockResolvedValue({
      envelope: { id: "e1", status: "executed" },
      result: {
        kind: "care_request_draft",
        careRequestId: "cr-1",
        status: "draft",
      },
    } as never);

    const res = await executePost(
      new Request("http://localhost/api/navigator/action-envelopes/e1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonce: "nonce-1",
          confirmed: true,
          tenantId: "t1",
        }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.result.kind).toBe("care_request_draft");
    expect(body.result.careRequestId).toBe("cr-1");
    expect(executeNavigatorEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        envelopeId: "e1",
        actorUserId: "u1",
        nonce: "nonce-1",
      }),
    );
  });

  it("requires confirmed:true on execute", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      primaryRole: "participant",
      roles: ["participant"],
    } as never);

    const res = await executePost(
      new Request("http://localhost/api/navigator/action-envelopes/e1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: "n1" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );
    expect(res.status).toBe(400);
  });
});

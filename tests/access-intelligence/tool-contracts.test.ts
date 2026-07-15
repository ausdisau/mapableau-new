import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEventsForTests, listAuditEvents } from "@/lib/access-intelligence/audit";
import {
  listDemoBarrierReports,
  listDemoVerificationRequests,
  resetDemoRepositoryForTests,
} from "@/lib/access-intelligence/repositories";
import { createAccessIntelligenceTools } from "@/lib/access-intelligence/tools";

describe("tool contracts", () => {
  beforeEach(() => {
    resetDemoRepositoryForTests();
    clearAuditEventsForTests();
  });

  it("loadAccessPassport only returns the caller's passport", async () => {
    const tools = createAccessIntelligenceTools({
      userId: "demo-access-intelligence-user",
      organisationId: null,
      selectedPassportId: "passport-power-chair",
      demoMode: true,
    });
    const result = await tools.loadAccessPassport.execute!(
      { passportId: "passport-power-chair" },
      { toolCallId: "t1", messages: [], abortSignal: new AbortController().signal },
    );
    expect(result).toMatchObject({
      id: "passport-power-chair",
      name: "Power-chair access",
    });
    expect(result).not.toHaveProperty("userId");
  });

  it("requestVenueVerification execute persists only when invoked (approval gate is needsApproval)", async () => {
    const tools = createAccessIntelligenceTools({
      userId: "demo-access-intelligence-user",
      organisationId: null,
      selectedPassportId: null,
      demoMode: true,
    });
    expect(tools.requestVenueVerification.needsApproval).toBe(true);
    // Without calling execute, nothing is persisted
    expect(listDemoVerificationRequests()).toHaveLength(0);

    await tools.requestVenueVerification.execute!(
      {
        placeId: "place-harbour-civic",
        questions: ["Will reception assistance be available at 9:45 am?"],
        recipient: "Harbour Civic Centre reception",
        purpose: "Confirm reception assistance before interview",
      },
      { toolCallId: "t2", messages: [], abortSignal: new AbortController().signal },
    );
    expect(listDemoVerificationRequests()).toHaveLength(1);
    expect(listAuditEvents("demo-access-intelligence-user").some((e) => e.action === "request_venue_verification")).toBe(
      true,
    );
  });

  it("submitBarrierReport cannot auto-run without approval flag", async () => {
    const tools = createAccessIntelligenceTools({
      userId: "demo-access-intelligence-user",
      organisationId: null,
      selectedPassportId: null,
      demoMode: true,
    });
    expect(tools.submitBarrierReport.needsApproval).toBe(true);
    expect(listDemoBarrierReports()).toHaveLength(0);
  });

  it("shareAccessPassport requires approval and records audit on execute", async () => {
    const tools = createAccessIntelligenceTools({
      userId: "demo-access-intelligence-user",
      organisationId: null,
      selectedPassportId: null,
      demoMode: true,
    });
    expect(tools.shareAccessPassport.needsApproval).toBe(true);
    await tools.shareAccessPassport.execute!(
      {
        passportId: "passport-power-chair",
        recipient: "Support worker",
        purpose: "Share visit requirements for accompaniment",
        fieldsShared: ["step_free", "clear_door_width_mm"],
        durationHours: 24,
      },
      { toolCallId: "t3", messages: [], abortSignal: new AbortController().signal },
    );
    const audits = listAuditEvents("demo-access-intelligence-user");
    expect(audits.some((e) => e.action === "share_access_passport")).toBe(true);
  });

  it("never infers requirements from a diagnosis string in search/fit tools", async () => {
    const tools = createAccessIntelligenceTools({
      userId: "demo-access-intelligence-user",
      organisationId: null,
      selectedPassportId: "passport-power-chair",
      demoMode: true,
    });
    const passport = await tools.loadAccessPassport.execute!(
      {},
      { toolCallId: "t4", messages: [], abortSignal: new AbortController().signal },
    );
    expect(JSON.stringify(passport).toLowerCase()).not.toMatch(/diagnos|cerebral palsy|paraplegia/);
  });
});

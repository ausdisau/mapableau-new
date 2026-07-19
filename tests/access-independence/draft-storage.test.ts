/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  clearLocalDraft,
  loadLocalDraft,
  sanitizeAccountDraftPayload,
  sanitizeLocalDraftPayload,
  saveLocalDraft,
} from "@/lib/form-drafts/draft-storage";

describe("local form drafts", () => {
  afterEach(() => {
    clearLocalDraft("care-request-wizard");
    clearLocalDraft("access-barrier-report");
    clearLocalDraft("test-workflow");
  });

  it("saves allowlisted progress for care request without sensitive free text", () => {
    saveLocalDraft({
      workflowKey: "care-request-wizard",
      stepId: "tasks",
      payload: {
        requestType: "support",
        shareAccessibility: true,
        linkedTransport: false,
        stepId: "tasks",
        title: "Morning support",
        description: "Help with personal care at 12 Smith St",
        address: "12 Smith St",
        accessSummary: "Needs ramp",
        tasks: [{ label: "Shower assist" }],
      },
      ttlDays: 7,
    });
    const draft = loadLocalDraft("care-request-wizard");
    expect(draft?.payload.requestType).toBe("support");
    expect(draft?.payload.description).toBeUndefined();
    expect(draft?.payload.address).toBeUndefined();
    expect(draft?.payload.accessSummary).toBeUndefined();
    expect(draft?.payload.tasks).toBeUndefined();
    expect(draft?.payload.title).toBeUndefined();
  });

  it("never stores care description or address in localStorage", () => {
    const raw = window.localStorage.getItem(
      "mapable:form-draft:v1:care-request-wizard",
    );
    saveLocalDraft({
      workflowKey: "care-request-wizard",
      stepId: "describe",
      payload: {
        description: "Sensitive care notes",
        address: "1 Example Road",
        accessSummary: "Lift needed",
        requestType: "support",
      },
    });
    const stored = window.localStorage.getItem(
      "mapable:form-draft:v1:care-request-wizard",
    );
    expect(stored).toBeTruthy();
    expect(stored).not.toContain("Sensitive care notes");
    expect(stored).not.toContain("1 Example Road");
    expect(stored).not.toContain("Lift needed");
    expect(raw === null || !raw.includes("Sensitive")).toBe(true);
  });

  it("expires drafts past expiry", () => {
    saveLocalDraft({
      workflowKey: "care-request-wizard",
      stepId: "describe",
      payload: { requestType: "support" },
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    expect(loadLocalDraft("care-request-wizard")).toBeNull();
  });

  it("strips nested sensitive keys via allowlist", () => {
    const sanitized = sanitizeLocalDraftPayload("care-request-wizard", {
      requestType: "support",
      password: "secret",
      description: "Keep me out of local",
      nested: { address: "hidden", note: "nope" },
    });
    expect(sanitized).toEqual({ requestType: "support" });
  });

  it("rejects oversized drafts safely", () => {
    expect(() =>
      saveLocalDraft({
        workflowKey: "care-request-wizard",
        stepId: "describe",
        payload: {
          requestType: "x".repeat(20_000),
        },
      }),
    ).toThrow(/DRAFT_TOO_LARGE/);
  });

  it("account drafts may keep care text but strip never-draft secrets", () => {
    const account = sanitizeAccountDraftPayload({
      description: "Help with transfers",
      address: "10 Example St",
      password: "nope",
      tasks: [{ label: "Meal prep" }],
    });
    expect(account.description).toBe("Help with transfers");
    expect(account.address).toBe("10 Example St");
    expect(account.password).toBeUndefined();
    expect(account.tasks).toEqual([{ label: "Meal prep" }]);
  });

  it("clears incompatible schema versions", () => {
    window.localStorage.setItem(
      "mapable:form-draft:v1:care-request-wizard",
      JSON.stringify({
        version: 99,
        workflowKey: "care-request-wizard",
        stepId: "describe",
        payload: { requestType: "support" },
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    expect(loadLocalDraft("care-request-wizard")).toBeNull();
  });
});

/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  clearLocalDraft,
  loadLocalDraft,
  sanitizeLocalDraftPayload,
  saveLocalDraft,
} from "@/lib/form-drafts/draft-storage";

describe("local form drafts", () => {
  afterEach(() => {
    clearLocalDraft("test-workflow");
  });

  it("saves and restores a versioned draft", () => {
    saveLocalDraft({
      workflowKey: "test-workflow",
      stepId: "tasks",
      payload: { title: "Morning support" },
      ttlDays: 7,
    });
    const draft = loadLocalDraft("test-workflow");
    expect(draft?.version).toBe(1);
    expect(draft?.stepId).toBe("tasks");
    expect(draft?.payload.title).toBe("Morning support");
  });

  it("expires drafts past expiry", () => {
    saveLocalDraft({
      workflowKey: "test-workflow",
      stepId: "describe",
      payload: { title: "Old" },
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    expect(loadLocalDraft("test-workflow")).toBeNull();
  });

  it("strips sensitive keys before local storage", () => {
    const sanitized = sanitizeLocalDraftPayload({
      title: "OK",
      password: "secret",
      ndisNumber: "123",
      description: "Keep me",
    });
    expect(sanitized).toEqual({ title: "OK", description: "Keep me" });
  });
});

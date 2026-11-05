import { describe, expect, it } from "vitest";

import { createVirtualPersonaController } from "@/lib/virtual-persona/controller";

describe("createVirtualPersonaController", () => {
  it("runs a public question to response_ready", async () => {
    const c = createVirtualPersonaController();
    await c.send("What can MapAble help with?");
    const snap = c.getSnapshot();
    expect(snap.state).toBe("response_ready");
    expect(snap.history.some((h) => h.speaker === "participant")).toBe(true);
    expect(snap.history.some((h) => h.speaker === "persona")).toBe(true);
    expect(snap.history.find((h) => h.turn)?.turn?.actionAuthority).toBe("none");
  });

  it("stops processing and keeps control", async () => {
    const c = createVirtualPersonaController();
    const pending = c.send("What can MapAble help with?");
    c.stop();
    await pending;
    expect(c.getSnapshot().state).toBe("stopped");
  });

  it("supports draft edit and reject without execution", async () => {
    const c = createVirtualPersonaController();
    await c.send("Please draft a support request");
    let snap = c.getSnapshot();
    expect(snap.draft?.executable).toBe(false);
    c.beginDraftEdit();
    c.updateDraft("Edited locally. Do not send.");
    expect(c.getSnapshot().draft?.body).toContain("Edited locally");
    c.rejectDraft();
    snap = c.getSnapshot();
    expect(snap.draft).toBeNull();
    expect(snap.history.some((h) => h.text.includes("rejected the draft"))).toBe(
      true,
    );
  });

  it("does not send when AI assistance is opted out", async () => {
    const c = createVirtualPersonaController();
    c.setPrefs({ useAiAssistance: false });
    await c.send("Hello");
    const snap = c.getSnapshot();
    expect(snap.state).toBe("fallback_available");
  });

  it("clears history", async () => {
    const c = createVirtualPersonaController();
    await c.send("What can MapAble help with?");
    c.clear();
    expect(c.getSnapshot().history).toHaveLength(0);
    expect(c.getSnapshot().state).toBe("idle");
  });
});

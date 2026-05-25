import { describe, expect, it, vi, beforeEach } from "vitest";

import { mockVoiceAdapter } from "@/lib/voice/adapters/mock-voice-adapter";
import { buildDraftPayloadFromTranscript } from "@/lib/voice/voice-draft-builder";
import {
  createVoiceSession,
  assertTranscriptOwner,
} from "@/lib/voice/voice-session-service";
import {
  confirmTranscript,
  createIntentDraftFromTranscript,
  discardTranscript,
  updateTranscriptText,
} from "@/lib/voice/voice-intent-service";

vi.mock("@/lib/voice/voice-event-service", () => ({
  recordVoiceEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    voiceSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    voiceTranscript: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    voiceIntentDraft: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("mock voice adapter", () => {
  it("returns transcript from audio upload", async () => {
    const result = await mockVoiceAdapter.transcribe({
      audioBuffer: Buffer.from("fake"),
      mimeType: "audio/webm",
      sessionId: "s1",
      intendedDraftType: "care_request",
    });
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.adapter).toBe("mock");
  });
});

describe("draft builder", () => {
  it("marks drafts as requiring user submit", () => {
    const payload = buildDraftPayloadFromTranscript(
      "care_request",
      "Need help tomorrow"
    );
    expect(payload.requiresUserSubmit).toBe(true);
  });
});

describe("voice session service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates voice session", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceSession.create).mockResolvedValue({
      id: "sess-1",
      userId: "user-1",
      intendedDraftType: "care_request",
      status: "created",
    } as never);

    const session = await createVoiceSession({
      userId: "user-1",
      intendedDraftType: "care_request",
    });
    expect(session.id).toBe("sess-1");
  });
});

describe("transcript review flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows transcript edit", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      sessionId: "s1",
      status: "pending_review",
      session: { id: "s1", userId: "user-1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);
    vi.mocked(prisma.voiceTranscript.update).mockResolvedValue({
      id: "t1",
      editedTranscript: "Edited text",
    } as never);

    const updated = await updateTranscriptText("t1", "user-1", "Edited text");
    expect(updated.editedTranscript).toBe("Edited text");
  });

  it("blocks draft before confirmation", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      sessionId: "s1",
      status: "pending_review",
      rawTranscript: "Hello",
      editedTranscript: "Hello",
      session: { id: "s1", userId: "user-1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);

    await expect(
      createIntentDraftFromTranscript("t1", "user-1")
    ).rejects.toThrow("TRANSCRIPT_NOT_CONFIRMED");
  });

  it("creates draft after confirmation", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      sessionId: "s1",
      status: "confirmed",
      rawTranscript: "Need care",
      editedTranscript: "Need care",
      session: { id: "s1", userId: "user-1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);
    vi.mocked(prisma.voiceIntentDraft.create).mockResolvedValue({
      id: "d1",
      draftType: "care_request",
      draftPayloadJson: { requiresUserSubmit: true },
    } as never);
    vi.mocked(prisma.voiceSession.update).mockResolvedValue({} as never);

    const draft = await createIntentDraftFromTranscript("t1", "user-1");
    expect(draft.id).toBe("d1");
    expect(prisma.voiceIntentDraft.create).toHaveBeenCalled();
  });

  it("discard removes draft path", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      sessionId: "s1",
      status: "pending_review",
      session: { id: "s1", userId: "user-1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);
    vi.mocked(prisma.voiceTranscript.update).mockResolvedValue({ status: "discarded" } as never);
    vi.mocked(prisma.voiceSession.update).mockResolvedValue({ audioFileKey: null } as never);

    const result = await discardTranscript("t1", "user-1");
    expect(result.status).toBe("discarded");
  });

  it("blocks unauthorised access", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      session: { userId: "other-user", id: "s1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);

    await expect(assertTranscriptOwner("t1", "user-1")).rejects.toThrow("FORBIDDEN");
  });
});

describe("confirm transcript", () => {
  it("confirms pending transcript", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.voiceTranscript.findUnique).mockResolvedValue({
      id: "t1",
      sessionId: "s1",
      status: "pending_review",
      session: { id: "s1", userId: "user-1", intendedDraftType: "care_request", audioFileKey: null },
    } as never);
    vi.mocked(prisma.voiceTranscript.update).mockResolvedValue({ status: "confirmed" } as never);
    vi.mocked(prisma.voiceSession.update).mockResolvedValue({} as never);

    const t = await confirmTranscript("t1", "user-1");
    expect(t.status).toBe("confirmed");
  });
});

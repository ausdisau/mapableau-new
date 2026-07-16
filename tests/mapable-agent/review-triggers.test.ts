import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    toolExecutionLog: { create: vi.fn() },
    humanReviewTask: { create: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/queue/queues", () => ({
  enqueueNotifyReview: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { wrapToolExecution } from "@/lib/mapable-agent/tools/middleware";
import type { ToolDefinition } from "@/lib/mapable-agent/tools/types";

const lowConfidenceTool = (): ToolDefinition => ({
  name: "testTool",
  description: "test",
  sensitivity: "read",
  createsReviewOnLowConfidence: true,
  inputSchema: z.object({ value: z.string() }),
  execute: async () => ({ ok: true, data: { value: "x" }, confidence: 0.2 }),
});

describe("review triggers", () => {
  beforeEach(() => {
    vi.mocked(prisma.humanReviewTask.create).mockResolvedValue({
      id: "review-1",
      title: "Review: testTool",
      category: "low_confidence",
    } as never);
    vi.mocked(prisma.toolExecutionLog.create).mockResolvedValue({} as never);
  });

  it("creates HumanReviewTask when confidence below threshold", async () => {
    await wrapToolExecution(lowConfidenceTool(), { sessionId: "sess-1" }, { value: "a" });
    expect(prisma.humanReviewTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "low_confidence",
          sessionId: "sess-1",
        }),
      }),
    );
  });
});

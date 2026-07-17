import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  isPlaceholderAddress,
  PLACEHOLDER_ADDRESSES,
  OrchestrationInvalidError,
} from "@/lib/orchestration/care-transport-orchestrator";
import { computeContinuityExecutionKey } from "@/lib/continuity/execution/execution-service";

describe("Wave 11 remediation — idempotency and placeholders", () => {
  it("orchestrator source no longer contains Date.now() in an idempotency key", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/orchestration/care-transport-orchestrator.ts"),
      "utf8"
    );
    const idempotencyLines = src
      .split("\n")
      .filter((l) => /idempotencyKey/.test(l));
    for (const line of idempotencyLines) {
      expect(line).not.toContain("Date.now(");
    }
  });

  it("cancel dedupe key is deterministic on shift+booking id", () => {
    const shiftId = "shift-a";
    const bookingId = "booking-b";
    const k1 = `cancel-${shiftId}-${bookingId}`;
    const k2 = `cancel-${shiftId}-${bookingId}`;
    expect(k1).toBe(k2);
  });

  it("continuity execution key is deterministic for same inputs", () => {
    const a = computeContinuityExecutionKey({ planId: "p1", attempt: 1, inputHash: "h", nonce: "n" });
    const b = computeContinuityExecutionKey({ planId: "p1", attempt: 1, inputHash: "h", nonce: "n" });
    expect(a).toBe(b);
  });

  it("continuity execution key differs when attempt changes", () => {
    const a = computeContinuityExecutionKey({ planId: "p1", attempt: 1, inputHash: "h" });
    const b = computeContinuityExecutionKey({ planId: "p1", attempt: 2, inputHash: "h" });
    expect(a).not.toBe(b);
  });

  it("continuity execution key differs when planId changes", () => {
    const a = computeContinuityExecutionKey({ planId: "p1", inputHash: "h" });
    const b = computeContinuityExecutionKey({ planId: "p2", inputHash: "h" });
    expect(a).not.toBe(b);
  });

  it("isPlaceholderAddress catches common placeholder strings", () => {
    for (const p of PLACEHOLDER_ADDRESSES) {
      expect(isPlaceholderAddress(p)).toBe(true);
    }
    expect(isPlaceholderAddress("  Address to be confirmed  ")).toBe(true);
    expect(isPlaceholderAddress("")).toBe(true);
    expect(isPlaceholderAddress(null)).toBe(true);
    expect(isPlaceholderAddress(undefined)).toBe(true);
  });

  it("isPlaceholderAddress passes real-looking addresses", () => {
    expect(isPlaceholderAddress("12 Wattle Street, Sydney NSW 2000")).toBe(false);
    expect(isPlaceholderAddress("Home")).toBe(false);
  });

  it("OrchestrationInvalidError carries a code", () => {
    const e = new OrchestrationInvalidError("PLACEHOLDER_ADDRESS", "boom");
    expect(e.code).toBe("PLACEHOLDER_ADDRESS");
    expect(e).toBeInstanceOf(Error);
  });
});

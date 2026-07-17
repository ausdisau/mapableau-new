import { describe, expect, it } from "vitest";

import {
  assertCanTransition,
  canTransitionClaimStatus,
} from "@/lib/ndis-gateway/domain/claim-status";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";

describe("claim status transitions", () => {
  it("allows happy-path transitions", () => {
    expect(canTransitionClaimStatus("draft", "validated")).toBe(true);
    expect(canTransitionClaimStatus("validated", "awaiting_approval")).toBe(
      true
    );
    expect(canTransitionClaimStatus("awaiting_approval", "approved")).toBe(
      true
    );
    expect(canTransitionClaimStatus("approved", "preparing")).toBe(true);
    expect(canTransitionClaimStatus("submitted", "processing")).toBe(true);
    expect(canTransitionClaimStatus("accepted", "paid")).toBe(true);
    expect(canTransitionClaimStatus("paid", "closed")).toBe(true);
  });

  it("allows same-status no-op", () => {
    expect(canTransitionClaimStatus("draft", "draft")).toBe(true);
  });

  it("rejects impossible jumps", () => {
    expect(canTransitionClaimStatus("draft", "paid")).toBe(false);
    expect(canTransitionClaimStatus("voided", "submitted")).toBe(false);
    expect(canTransitionClaimStatus("closed", "draft")).toBe(false);
  });

  it("assertCanTransition throws NdisGatewayError on invalid jump", () => {
    expect(() => assertCanTransition("draft", "paid")).toThrow(NdisGatewayError);
    try {
      assertCanTransition("voided", "submitted");
    } catch (err) {
      expect(err).toBeInstanceOf(NdisGatewayError);
      expect((err as NdisGatewayError).code).toBe("INVALID_STATUS_TRANSITION");
    }
  });

  it("assertCanTransition allows valid jumps", () => {
    expect(() => assertCanTransition("draft", "validated")).not.toThrow();
  });
});

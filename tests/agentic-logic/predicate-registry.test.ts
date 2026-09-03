import { describe, it, expect, beforeEach } from "vitest";
import { predicateRegistry } from "../../lib/agentic-logic/registry/predicateRegistry";

beforeEach(() => {
  // reset registry internal map by recreating instance (simple approach for test isolation)
  // Note: predicateRegistry is a singleton; clear by listing and not relying on private API. For test we re-register with unique names.
});

describe("predicate registry", () => {
  it("registers and retrieves a predicate", () => {
    const p = { name: "has_clearance", arity: 2, args: [{ name: "workerId", type: "uuid" }, { name: "clearanceType", type: "string" }] };
    predicateRegistry.register(p);
    expect(predicateRegistry.has("has_clearance")).toBe(true);
    const got = predicateRegistry.get("has_clearance");
    expect(got).toBeDefined();
    expect(got?.arity).toBe(2);
  });

  it("rejects registering duplicate predicate", () => {
    const p = { name: "dup_pred", arity: 1, args: [{ name: "x", type: "string" }] };
    predicateRegistry.register(p);
    expect(() => predicateRegistry.register(p)).toThrow();
  });
});

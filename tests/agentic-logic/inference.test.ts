import { describe, it, expect, beforeEach } from "vitest";
import { factRegistry } from "../../lib/agentic-logic/registry/factRegistry";
import { predicateRegistry } from "../../lib/agentic-logic/registry/predicateRegistry";
import { ruleRegistry } from "../../lib/agentic-logic/registry/ruleRegistry";
import Grounder from "../../lib/agentic-logic/grounding/grounder";
import HardConstraintEngine from "../../lib/agentic-logic/inference/hardConstraintEngine";
import WeightedEngine from "../../lib/agentic-logic/inference/weightedEngine";
import { v4 as uuid } from "uuid";

beforeEach(() => {
  // clear registries
  (predicateRegistry as any).byName?.clear?.();
  (factRegistry as any).byId?.clear?.();
  (ruleRegistry as any).clear?.();
});

describe("agentic logic inference (minimal)", () => {
  it("hard constraint blocks when required fact missing", () => {
    // register a hard rule requiring "has_clearance"
    const r = { id: uuid(), name: "need-clearance", type: "hard_constraint", formula: "has_clearance(workerId, clearance)" };
    ruleRegistry.register(r);

    const facts = [
      { id: uuid(), tenantId: 't1', subject: 'w1', predicate: 'available', object: true, state: 'confirmed' } as any
    ];
    facts.forEach(f => factRegistry.add(f));

    const grounder = new Grounder({ tenantId: 't1' });
    const grounded = grounder.groundFacts();

    const hard = new HardConstraintEngine();
    const res = hard.evaluate(ruleRegistry.list(), grounded);
    expect(res.violated.length).toBeGreaterThan(0);
  });

  it("weighted engine sums weights and returns score; disputed facts ignored", () => {
    const r1 = { id: uuid(), name: 'w1', type: 'weighted_rule', weight: 1.0, formula: 'trained(workerId,skill)' };
    const r2 = { id: uuid(), name: 'w2', type: 'weighted_rule', weight: 2.0, formula: 'comm_pref(workerId,mode)' };
    ruleRegistry.register(r1);
    ruleRegistry.register(r2);

    const f1 = { id: uuid(), tenantId: 't1', subject: 'w1', predicate: 'trained', object: 'firstaid', state: 'confirmed' } as any;
    const f2 = { id: uuid(), tenantId: 't1', subject: 'w1', predicate: 'comm_pref', object: 'verbal', state: 'disputed' } as any;
    factRegistry.add(f1);
    factRegistry.add(f2);

    const grounder = new Grounder({ tenantId: 't1' });
    const grounded = grounder.groundFacts();

    const weighted = new WeightedEngine();
    const res = weighted.evaluate(ruleRegistry.list(), grounded);
    // only f1 counted (f2 disputed), score = exp(1.0)
    expect(res.supportingFacts.length).toBe(1);
    expect(res.score).toBeCloseTo(Math.exp(1.0));
  });
});

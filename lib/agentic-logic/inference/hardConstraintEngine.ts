import { Rule } from "../contracts/rule";
import { Fact } from "../contracts/fact";

// Very small evaluator for hard constraints. The rule.formula is expected to be a simple
// predicate call in the form `predicate(arg1,arg2,...)`. For hard constraints we treat
// formula as a condition that MUST be true for a candidate; if absent -> violation.

function parseCall(formula: string): { predicate: string; args: string[] } {
  const m = formula.match(/^(\w+)\((.*)\)$/);
  if (!m) throw new Error(`Unsupported formula: ${formula}`);
  const predicate = m[1];
  const args = m[2].split(',').map(s => s.trim()).filter(Boolean);
  return { predicate, args };
}

export class HardConstraintEngine {
  public evaluate(rules: Rule[], facts: Fact[]): { violated: Rule[]; satisfied: Rule[] } {
    const violated: Rule[] = [];
    const satisfied: Rule[] = [];

    for (const r of rules.filter(x => x.type === 'hard_constraint')) {
      try {
        const { predicate, args } = parseCall((r as any).formula || '');
        // check if any fact matches predicate name
        const match = facts.find(f => f.predicate === predicate);
        if (!match) {
          violated.push(r);
        } else {
          satisfied.push(r);
        }
      } catch (e) {
        // if parsing fails, conservatively treat as violated
        violated.push(r);
      }
    }

    return { violated, satisfied };
  }
}

export default HardConstraintEngine;
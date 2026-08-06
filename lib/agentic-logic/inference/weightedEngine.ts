import { Rule } from "../contracts/rule";
import { Fact } from "../contracts/fact";

// Minimal weighted engine: sums weights of satisfied weighted_rules. Formula syntax is
// a simple predicate(arg1,arg2).

function parseCall(formula: string): { predicate: string; args: string[] } {
  const m = formula.match(/^(\w+)\((.*)\)$/);
  if (!m) throw new Error(`Unsupported formula: ${formula}`);
  const predicate = m[1];
  const args = m[2].split(',').map(s => s.trim()).filter(Boolean);
  return { predicate, args };
}

export type InferenceResult = {
  score: number;
  supportingRules: string[];
  supportingFacts: string[];
};

export class WeightedEngine {
  evaluate(rules: Rule[], facts: Fact[]): InferenceResult {
    let sum = 0;
    const supportingRules: string[] = [];
    const supportingFacts: string[] = [];

    for (const r of rules.filter(x => x.type === 'weighted_rule')) {
      try {
        const parsed = parseCall((r as any).formula || '');
        const match = facts.find(f => f.predicate === parsed.predicate && f.state !== 'disputed');
        if (match) {
          const w = (r as any).weight || 0;
          sum += w;
          supportingRules.push(r.id);
          supportingFacts.push(match.id);
        }
      } catch (e) {
        // ignore unparsable rules for now
      }
    }

    // convert to a simple log-linear score
    const score = Math.exp(sum);
    return { score, supportingRules, supportingFacts };
  }
}

export default WeightedEngine;
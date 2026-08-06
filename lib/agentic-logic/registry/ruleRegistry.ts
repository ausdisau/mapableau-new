import { RuleSchema, type Rule } from "../contracts/rule";

export class RuleRegistry {
  private byId: Map<string, Rule> = new Map();

  register(rule: unknown) {
    const r = RuleSchema.parse(rule);
    if (this.byId.has(r.id)) throw new Error(`Rule already registered: ${r.id}`);
    this.byId.set(r.id, r);
    return r;
  }

  list(): Rule[] {
    return Array.from(this.byId.values());
  }

  clear() {
    this.byId.clear();
  }
}

export const ruleRegistry = new RuleRegistry();

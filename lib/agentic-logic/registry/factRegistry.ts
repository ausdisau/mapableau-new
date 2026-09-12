import { FactSchema, type Fact } from "../contracts/fact";

export class FactRegistry {
  private byId: Map<string, Fact> = new Map();

  add(f: unknown) {
    const fact = FactSchema.parse(f);
    if (this.byId.has(fact.id)) throw new Error(`Fact already exists: ${fact.id}`);
    this.byId.set(fact.id, fact);
    return fact;
  }

  getById(id: string): Fact | undefined {
    return this.byId.get(id);
  }

  queryByPredicate(predicate: string): Fact[] {
    return Array.from(this.byId.values()).filter((f) => f.predicate === predicate);
  }

  clear() {
    this.byId.clear();
  }
}

export const factRegistry = new FactRegistry();

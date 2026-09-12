import { PredicateSchema, type Predicate } from "../contracts/predicate";
import { z } from "zod";

export class PredicateRegistry {
  private byName: Map<string, Predicate> = new Map();

  register(predicate: unknown) {
    const p = PredicateSchema.parse(predicate);
    if (this.byName.has(p.name)) {
      throw new Error(`Predicate already registered: ${p.name}`);
    }
    this.byName.set(p.name, p);
    return p;
  }

  get(name: string): Predicate | undefined {
    return this.byName.get(name);
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  list(): Predicate[] {
    return Array.from(this.byName.values());
  }
}

export const predicateRegistry = new PredicateRegistry();

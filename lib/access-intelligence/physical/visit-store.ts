import type { PlanPhysicalVisitResult } from "./services/plan-visit";

export type StoredPhysicalVisitPlan = {
  id: string;
  userId: string;
  passportId: string;
  placeId: string;
  destinationLabel: string;
  visitAt?: string;
  createdAt: string;
  plan: PlanPhysicalVisitResult;
};

const plans = new Map<string, StoredPhysicalVisitPlan>();

export function savePhysicalVisitPlan(
  plan: StoredPhysicalVisitPlan,
): StoredPhysicalVisitPlan {
  plans.set(plan.id, structuredClone(plan));
  return structuredClone(plan);
}

export function listPhysicalVisitPlans(
  userId: string,
): StoredPhysicalVisitPlan[] {
  return [...plans.values()]
    .filter((p) => p.userId === userId)
    .map((p) => structuredClone(p))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPhysicalVisitPlan(
  userId: string,
  id: string,
): StoredPhysicalVisitPlan | null {
  const found = plans.get(id);
  if (!found || found.userId !== userId) return null;
  return structuredClone(found);
}

export function resetPhysicalVisitStore(): void {
  plans.clear();
}

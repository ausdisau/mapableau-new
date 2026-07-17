import { computeErrorBudgetBurn } from "@/lib/sre/slos";

export interface BurnStatus {
  burn: number;
  level: "healthy" | "warning" | "critical";
}

export function classifyBurn(availability: number, target: number): BurnStatus {
  const burn = computeErrorBudgetBurn(availability, target);
  if (burn >= 1) return { burn, level: "critical" };
  if (burn >= 0.5) return { burn, level: "warning" };
  return { burn, level: "healthy" };
}

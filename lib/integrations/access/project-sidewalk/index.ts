import { projectSidewalkAdapter } from "./adapter";
import { registerAccessEvidenceProvider } from "../registry";

export * from "./adapter";
export * from "./mapper";
export * from "./schemas";
export * from "./idempotency";

export function registerProjectSidewalkProvider(): void {
  registerAccessEvidenceProvider(projectSidewalkAdapter);
}

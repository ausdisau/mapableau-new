import { registerAccessEvidenceProvider } from "../registry";
import { open311Adapter } from "./adapter";

export * from "./adapter";
export * from "./schemas";

export function registerOpen311Provider(): void {
  registerAccessEvidenceProvider(open311Adapter);
}

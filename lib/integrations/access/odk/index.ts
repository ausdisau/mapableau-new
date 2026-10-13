import { registerAccessEvidenceProvider } from "../registry";
import { odkAdapter } from "./adapter";

export * from "./adapter";
export * from "./schemas";

export function registerOdkProvider(): void {
  registerAccessEvidenceProvider(odkAdapter);
}

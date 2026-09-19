import { registerAccessEvidenceProvider } from "../registry";
import { mapableQuestsAdapter } from "./adapter";

export * from "./adapter";

export function registerMapableQuestsProvider(): void {
  registerAccessEvidenceProvider(mapableQuestsAdapter);
}

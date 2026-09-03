import { panoramaxAdapter } from "./adapter";
import { registerAccessEvidenceProvider } from "../registry";

export * from "./adapter";
export * from "./client";
export * from "./errors";
export * from "./mapper";
export * from "./schemas";

export function registerPanoramaxProvider(): void {
  registerAccessEvidenceProvider(panoramaxAdapter);
}

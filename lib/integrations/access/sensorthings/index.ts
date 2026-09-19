import { registerAccessEvidenceProvider } from "../registry";
import { sensorThingsAdapter } from "./adapter";

export * from "./adapter";
export * from "./mapper";
export * from "./schemas";

export function registerSensorThingsProvider(): void {
  registerAccessEvidenceProvider(sensorThingsAdapter);
}

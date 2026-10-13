/**
 * Access Integration Gateway bootstrap — registers all evidence providers.
 * Safe to import at app startup; flags remain fail-closed OFF by default.
 */

import { registerPanoramaxProvider } from "./panoramax";
import { registerProjectSidewalkProvider } from "./project-sidewalk";
import { registerOpen311Provider } from "./open311";
import { registerOdkProvider } from "./odk";
import { registerSensorThingsProvider } from "./sensorthings";
import { registerMapableQuestsProvider } from "./mapable-quests";

export * from "./contracts";
export * from "./flags";
export * from "./registry";
export * from "./provenance";

let bootstrapped = false;

export function bootstrapAccessIntegrationGateway(): void {
  if (bootstrapped) return;
  registerPanoramaxProvider();
  registerProjectSidewalkProvider();
  registerOpen311Provider();
  registerOdkProvider();
  registerSensorThingsProvider();
  registerMapableQuestsProvider();
  bootstrapped = true;
}

export function __resetAccessIntegrationBootstrapForTests(): void {
  bootstrapped = false;
}

// Auto-register on module load for API routes that import this entry.
bootstrapAccessIntegrationGateway();

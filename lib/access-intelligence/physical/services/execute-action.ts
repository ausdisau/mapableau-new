import type { PhysicalActionExecution } from "../schemas";
import {
  getHarbourPhysicalSimulator,
  type HarbourPhysicalSimulator,
} from "../simulator/harbour-simulator";

import {
  getPhysicalActionTransactionManager,
} from "./propose-action";

/**
 * Execute an authorised physical action via the transaction manager.
 * Re-runs safety, calls fictional adapter, verifies postconditions.
 */
export async function executeAuthorisedAction(
  executionId: string,
  simulator?: HarbourPhysicalSimulator,
): Promise<PhysicalActionExecution> {
  const sim = simulator ?? getHarbourPhysicalSimulator();
  const manager = getPhysicalActionTransactionManager(sim);
  return manager.execute(executionId);
}

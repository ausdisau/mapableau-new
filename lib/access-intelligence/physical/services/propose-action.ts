import type { AccessPassport } from "../../schemas";
import { listHarbourCapabilities } from "../capabilities/harbour";
import { PhysicalSystemsError } from "../errors";
import type { PhysicalActionExecution } from "../schemas";
import {
  getHarbourPhysicalSimulator,
  type HarbourPhysicalSimulator,
} from "../simulator/harbour-simulator";
import { PhysicalActionTransactionManager } from "../actions/transaction";

let managerSingleton: PhysicalActionTransactionManager | null = null;
let boundSimulator: HarbourPhysicalSimulator | null = null;

function buildManager(
  simulator: HarbourPhysicalSimulator,
): PhysicalActionTransactionManager {
  return new PhysicalActionTransactionManager({
    getDevice: (deviceId) => simulator.getDevice(deviceId),
    getEmergency: () => simulator.getEmergency(),
    getCapability: (capabilityId) => {
      const state = simulator.getState();
      return listHarbourCapabilities({
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        emergencyActive: state.emergency.active,
        devices: state.devices,
      }).find((c) => c.id === capabilityId);
    },
    onSimulatorTick: (_executionId, capabilityId) => {
      simulator.tickForExecution(capabilityId);
    },
  });
}

/**
 * Returns the shared transaction manager bound to the Harbour simulator.
 * Pass a distinct simulator instance only for isolated tests — that returns a
 * fresh manager (separate in-memory store).
 */
export function getPhysicalActionTransactionManager(
  simulator?: HarbourPhysicalSimulator,
): PhysicalActionTransactionManager {
  const defaultSim = getHarbourPhysicalSimulator();
  if (simulator && simulator !== defaultSim) {
    return buildManager(simulator);
  }
  if (!managerSingleton || boundSimulator !== defaultSim) {
    managerSingleton = buildManager(defaultSim);
    boundSimulator = defaultSim;
  }
  return managerSingleton;
}

/** Reset manager singleton (tests). */
export function resetPhysicalActionTransactionManager(): void {
  managerSingleton = null;
  boundSimulator = null;
}

export async function proposePhysicalAction(input: {
  placeId: string;
  userId: string;
  capabilityId: string;
  rationale: string;
  parameters?: Record<string, unknown>;
  passport?: AccessPassport;
  simulator?: HarbourPhysicalSimulator;
}): Promise<PhysicalActionExecution> {
  const manager = getPhysicalActionTransactionManager(input.simulator);

  const sim = input.simulator ?? getHarbourPhysicalSimulator();
  const state = sim.getState();
  const capability = listHarbourCapabilities({
    mainLiftOutage: state.mainLiftOutage,
    doorEntBFault: state.doorEntBFault,
    emergencyActive: state.emergency.active,
    devices: state.devices,
  }).find((c) => c.id === input.capabilityId);

  if (!capability) {
    throw new PhysicalSystemsError(
      "CAPABILITY_NOT_FOUND",
      `Capability ${input.capabilityId} not found for Harbour twin.`,
    );
  }

  return manager.propose({
    placeId: input.placeId,
    userId: input.userId,
    capabilityId: input.capabilityId,
    rationale: input.rationale,
    parameters: input.parameters,
  });
}

/**
 * Shared adapter contracts for fictional Physical Systems devices.
 */
import type {
  DeviceCondition,
  DeviceHealthState,
  DeviceState,
} from "../schemas";

export type {
  DeviceCondition,
  DeviceHealthState,
  DeviceState,
};

export type ExecuteCapabilityInput = {
  capabilityId: string;
  deviceId: string;
  actionType: string;
  parameters: Record<string, unknown>;
  executionId: string;
  simulated: boolean;
};

export type ExecuteCapabilityResult = {
  ack: string;
  accepted: boolean;
  message: string;
  fictional: true;
  /** Immediate state hint; simulator may advance further. */
  devicePatch?: Partial<DeviceState>;
  postconditionHints?: string[];
};

export type PhysicalDeviceAdapter = {
  readonly id: string;
  readonly deviceId: string;
  readonly fictional: true;
  readonly label: string;
  getState(): DeviceState;
  reset(): void;
  setState(patch: Partial<DeviceState>): DeviceState;
  executeCapability(
    input: ExecuteCapabilityInput,
  ): Promise<ExecuteCapabilityResult>;
};

export const FICTIONAL_ADAPTER_NOTICE =
  "Fictional demo adapter — does not control real building hardware.";

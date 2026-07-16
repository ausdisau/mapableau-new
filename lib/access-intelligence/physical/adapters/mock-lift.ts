import type { DeviceState } from "../schemas";

import {
  FICTIONAL_ADAPTER_NOTICE,
  type ExecuteCapabilityInput,
  type ExecuteCapabilityResult,
  type PhysicalDeviceAdapter,
} from "./types";

const DEVICE_ID = "dev-lift-west";

function baseState(): DeviceState {
  return {
    deviceId: DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Western lift (fictional)",
    kind: "lift",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      floor: "G",
      notice: FICTIONAL_ADAPTER_NOTICE,
      cabin: "idle",
    },
  };
}

let state: DeviceState = baseState();

export const mockLiftWestAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-lift-west",
  deviceId: DEVICE_ID,
  fictional: true,
  label: "Mock western lift (fictional)",

  getState() {
    return { ...state, metadata: { ...state.metadata } };
  },

  reset() {
    state = baseState();
  },

  setState(patch) {
    state = {
      ...state,
      ...patch,
      deviceId: DEVICE_ID,
      fictional: true,
      lastObservedAt: patch.lastObservedAt ?? new Date().toISOString(),
      metadata: { ...state.metadata, ...patch.metadata },
    };
    return this.getState();
  },

  async executeCapability(
    input: ExecuteCapabilityInput,
  ): Promise<ExecuteCapabilityResult> {
    if (!state.online || state.health === "offline") {
      return {
        ack: `nack:${input.executionId}`,
        accepted: false,
        message: "Western lift offline (fictional).",
        fictional: true,
      };
    }
    state = {
      ...state,
      condition: "normal",
      lastObservedAt: new Date().toISOString(),
      metadata: {
        ...state.metadata,
        cabin: "called",
        lastCallExecutionId: input.executionId,
        targetFloor: input.parameters["floor"] ?? "G",
      },
    };
    return {
      ack: `ack-lift-west:${input.executionId}`,
      accepted: true,
      message: "Fictional lift call accepted; awaiting cabin arrival simulation.",
      fictional: true,
      devicePatch: { condition: "normal" },
      postconditionHints: ["cabin_called"],
    };
  },
};

/** Alias covering main lift device id for registry lookup. */
const MAIN_DEVICE_ID = "dev-lift-main";

function mainBaseState(): DeviceState {
  return {
    deviceId: MAIN_DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Main lift (fictional)",
    kind: "lift",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      floor: "G",
      notice: FICTIONAL_ADAPTER_NOTICE,
      cabin: "idle",
    },
  };
}

let mainState: DeviceState = mainBaseState();

export const mockLiftMainAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-lift-main",
  deviceId: MAIN_DEVICE_ID,
  fictional: true,
  label: "Mock main lift (fictional)",

  getState() {
    return { ...mainState, metadata: { ...mainState.metadata } };
  },

  reset() {
    mainState = mainBaseState();
  },

  setState(patch) {
    mainState = {
      ...mainState,
      ...patch,
      deviceId: MAIN_DEVICE_ID,
      fictional: true,
      lastObservedAt: patch.lastObservedAt ?? new Date().toISOString(),
      metadata: { ...mainState.metadata, ...patch.metadata },
    };
    return this.getState();
  },

  async executeCapability(
    input: ExecuteCapabilityInput,
  ): Promise<ExecuteCapabilityResult> {
    if (
      !mainState.online ||
      mainState.health === "offline" ||
      mainState.condition === "outage"
    ) {
      return {
        ack: `nack:${input.executionId}`,
        accepted: false,
        message: "Main lift unavailable / outage (fictional).",
        fictional: true,
      };
    }
    mainState = {
      ...mainState,
      lastObservedAt: new Date().toISOString(),
      metadata: {
        ...mainState.metadata,
        cabin: "called",
        lastCallExecutionId: input.executionId,
      },
    };
    return {
      ack: `ack-lift-main:${input.executionId}`,
      accepted: true,
      message: "Fictional main lift call accepted.",
      fictional: true,
      postconditionHints: ["cabin_called"],
    };
  },
};

/** Combined export used by registry for either lift capability. */
export const mockLiftAdapter = {
  west: mockLiftWestAdapter,
  main: mockLiftMainAdapter,
};

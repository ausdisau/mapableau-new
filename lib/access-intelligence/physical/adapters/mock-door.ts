import type { DeviceState } from "../schemas";

import {
  FICTIONAL_ADAPTER_NOTICE,
  type ExecuteCapabilityInput,
  type ExecuteCapabilityResult,
  type PhysicalDeviceAdapter,
} from "./types";

const DEVICE_ID = "dev-door-ent-b";

function baseState(): DeviceState {
  return {
    deviceId: DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Entrance B authorised door (fictional)",
    kind: "door",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      open: false,
      notice: FICTIONAL_ADAPTER_NOTICE,
    },
  };
}

let state: DeviceState = baseState();

export const mockDoorAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-door-ent-b",
  deviceId: DEVICE_ID,
  fictional: true,
  label: "Mock Entrance B door (fictional)",

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
    if (!state.online || state.condition === "fault") {
      return {
        ack: `nack:${input.executionId}`,
        accepted: false,
        message: "Entrance B door fault / offline (fictional).",
        fictional: true,
      };
    }
    state = {
      ...state,
      lastObservedAt: new Date().toISOString(),
      metadata: {
        ...state.metadata,
        open: true,
        lastOpenExecutionId: input.executionId,
      },
    };
    return {
      ack: `ack-door-ent-b:${input.executionId}`,
      accepted: true,
      message: "Fictional authorised door open pulse accepted.",
      fictional: true,
      postconditionHints: ["door_open_pulse"],
    };
  },
};

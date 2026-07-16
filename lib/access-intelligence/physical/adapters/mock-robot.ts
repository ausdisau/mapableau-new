import type { DeviceState } from "../schemas";
import {
  FICTIONAL_ADAPTER_NOTICE,
  type ExecuteCapabilityInput,
  type ExecuteCapabilityResult,
  type PhysicalDeviceAdapter,
} from "./types";

const DEVICE_ID = "dev-robot-escort-sim";

function baseState(): DeviceState {
  return {
    deviceId: DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Simulated robot escort (clearly fictional)",
    kind: "robot_sim",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      status: "docked",
      clearlySimulated: true,
      notice: FICTIONAL_ADAPTER_NOTICE,
    },
  };
}

let state: DeviceState = baseState();

export const mockRobotAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-robot-escort",
  deviceId: DEVICE_ID,
  fictional: true,
  label: "Mock simulated robot escort (fictional)",

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
    state = {
      ...state,
      lastObservedAt: new Date().toISOString(),
      metadata: {
        ...state.metadata,
        status: "dispatched_sim",
        clearlySimulated: true,
        lastDispatchExecutionId: input.executionId,
        destination: input.parameters["destination"] ?? "n-hcc-room",
      },
    };
    return {
      ack: `ack-robot-sim:${input.executionId}`,
      accepted: true,
      message:
        "Clearly simulated robot escort dispatched (fictional — no real robot).",
      fictional: true,
      postconditionHints: ["robot_dispatched_sim"],
    };
  },
};

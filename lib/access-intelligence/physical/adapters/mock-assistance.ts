import type { DeviceState } from "../schemas";

import {
  FICTIONAL_ADAPTER_NOTICE,
  type ExecuteCapabilityInput,
  type ExecuteCapabilityResult,
  type PhysicalDeviceAdapter,
} from "./types";

const DEVICE_ID = "dev-reception-assist";

function baseState(): DeviceState {
  return {
    deviceId: DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Reception assistance desk (fictional)",
    kind: "assistance",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      queueDepth: 0,
      notice: FICTIONAL_ADAPTER_NOTICE,
    },
  };
}

let state: DeviceState = baseState();

export const mockAssistanceAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-assistance",
  deviceId: DEVICE_ID,
  fictional: true,
  label: "Mock reception assistance (fictional)",

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
    const depth = Number(state.metadata?.["queueDepth"] ?? 0) + 1;
    state = {
      ...state,
      lastObservedAt: new Date().toISOString(),
      metadata: {
        ...state.metadata,
        queueDepth: depth,
        lastTicket: input.executionId,
        preference: input.parameters["communication"] ?? "in_person",
      },
    };
    return {
      ack: `ack-assist:${input.executionId}`,
      accepted: true,
      message: "Fictional staff assistance request queued at reception.",
      fictional: true,
      postconditionHints: ["assistance_queued"],
    };
  },
};

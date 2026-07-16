import type { DeviceState } from "../schemas";

import {
  FICTIONAL_ADAPTER_NOTICE,
  type ExecuteCapabilityInput,
  type ExecuteCapabilityResult,
  type PhysicalDeviceAdapter,
} from "./types";

const DEVICE_ID = "dev-room-312";

function baseState(): DeviceState {
  return {
    deviceId: DEVICE_ID,
    placeId: "place-harbour-civic",
    label: "Interview Room 3.12 accessibility controls (fictional)",
    kind: "room",
    health: "healthy",
    condition: "normal",
    online: true,
    lastObservedAt: new Date().toISOString(),
    fictional: true,
    metadata: {
      captions: false,
      largePrint: false,
      visualWayfinding: false,
      lowGlare: false,
      notice: FICTIONAL_ADAPTER_NOTICE,
    },
  };
}

let state: DeviceState = baseState();

export const mockRoomAdapter: PhysicalDeviceAdapter = {
  id: "adapter-mock-room-312",
  deviceId: DEVICE_ID,
  fictional: true,
  label: "Mock Room 3.12 controls (fictional)",

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
    const meta = { ...state.metadata };
    switch (input.actionType) {
      case "enable_captions":
        meta["captions"] = true;
        break;
      case "enable_large_print":
        meta["largePrint"] = true;
        break;
      case "enable_visual_wayfinding":
        meta["visualWayfinding"] = true;
        break;
      case "enable_low_glare":
        meta["lowGlare"] = true;
        break;
      default:
        meta["lastAction"] = input.actionType;
    }
    state = {
      ...state,
      lastObservedAt: new Date().toISOString(),
      metadata: meta,
    };
    return {
      ack: `ack-room-312:${input.executionId}`,
      accepted: true,
      message: `Fictional room accessibility setting applied (${input.actionType}).`,
      fictional: true,
      postconditionHints: [input.actionType],
    };
  },
};

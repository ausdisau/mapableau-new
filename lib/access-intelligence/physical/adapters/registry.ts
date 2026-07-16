import { PhysicalSystemsError } from "../errors";
import { mockAssistanceAdapter } from "./mock-assistance";
import { mockDoorAdapter } from "./mock-door";
import { mockLiftMainAdapter, mockLiftWestAdapter } from "./mock-lift";
import { mockRobotAdapter } from "./mock-robot";
import { mockRoomAdapter } from "./mock-room";
import type { PhysicalDeviceAdapter } from "./types";

const CAPABILITY_TO_ADAPTER: Record<string, PhysicalDeviceAdapter> = {
  "cap-lift-west-call": mockLiftWestAdapter,
  "cap-lift-main-call": mockLiftMainAdapter,
  "cap-door-ent-b-open": mockDoorAdapter,
  "cap-room-312-captions": mockRoomAdapter,
  "cap-room-312-large-print": mockRoomAdapter,
  "cap-room-312-visual-wayfinding": mockRoomAdapter,
  "cap-room-312-low-glare": mockRoomAdapter,
  "cap-reception-assist": mockAssistanceAdapter,
  "cap-robot-escort-sim": mockRobotAdapter,
};

const DEVICE_TO_ADAPTER: Record<string, PhysicalDeviceAdapter> = {
  [mockLiftWestAdapter.deviceId]: mockLiftWestAdapter,
  [mockLiftMainAdapter.deviceId]: mockLiftMainAdapter,
  [mockDoorAdapter.deviceId]: mockDoorAdapter,
  [mockRoomAdapter.deviceId]: mockRoomAdapter,
  [mockAssistanceAdapter.deviceId]: mockAssistanceAdapter,
  [mockRobotAdapter.deviceId]: mockRobotAdapter,
};

export function getAdapterForCapability(
  capabilityId: string,
): PhysicalDeviceAdapter {
  const adapter = CAPABILITY_TO_ADAPTER[capabilityId];
  if (!adapter) {
    throw new PhysicalSystemsError(
      "CAPABILITY_NOT_FOUND",
      `No fictional adapter registered for capability ${capabilityId}.`,
      undefined,
      { capabilityId },
    );
  }
  return adapter;
}

export function getAdapterForDevice(deviceId: string): PhysicalDeviceAdapter {
  const adapter = DEVICE_TO_ADAPTER[deviceId];
  if (!adapter) {
    throw new PhysicalSystemsError(
      "UNKNOWN_DEVICE",
      `No fictional adapter registered for device ${deviceId}.`,
      undefined,
      { deviceId },
    );
  }
  return adapter;
}

export function listRegisteredAdapters(): PhysicalDeviceAdapter[] {
  return Object.values(DEVICE_TO_ADAPTER);
}

export function resetAllAdapters(): void {
  for (const adapter of listRegisteredAdapters()) {
    adapter.reset();
  }
}

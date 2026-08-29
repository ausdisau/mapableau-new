/**
 * In-process device registry for native Android (Phase 10).
 * Prefer evolving to Prisma when companion device model is promoted.
 * Not durable across serverless cold starts — acceptable for scaffold.
 */

export type MobileDeviceRecord = {
  deviceId: string;
  userId: string;
  platform: "android" | "ios";
  appVersion: string;
  pushToken: string | null;
  updatedAt: string;
};

const devices = new Map<string, MobileDeviceRecord>();

function key(userId: string, deviceId: string): string {
  return `${userId}::${deviceId}`;
}

export function enrolMobileDevice(input: MobileDeviceRecord): MobileDeviceRecord {
  const record = { ...input, updatedAt: new Date().toISOString() };
  devices.set(key(input.userId, input.deviceId), record);
  return record;
}

export function revokeMobileDevice(userId: string, deviceId: string): boolean {
  return devices.delete(key(userId, deviceId));
}

export function listMobileDevicesForUser(userId: string): MobileDeviceRecord[] {
  return [...devices.values()].filter((d) => d.userId === userId);
}

/** Test helper */
export function __resetMobileDeviceRegistryForTests(): void {
  devices.clear();
}

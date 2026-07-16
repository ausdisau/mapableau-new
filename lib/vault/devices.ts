import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isVaultDeviceTrustEnabled } from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

function assertDeviceEnabled() {
  if (!isVaultDeviceTrustEnabled()) {
    throw new VaultDisabledError("VAULT_DEVICE_TRUST_DISABLED");
  }
}

export async function listVaultDevices(ownerUserId: string) {
  assertDeviceEnabled();
  const vault = await getOrCreatePersonalVault(ownerUserId);
  return prisma.vaultDevice.findMany({
    where: { vaultId: vault.id },
    orderBy: { registeredAt: "desc" },
  });
}

export async function registerVaultDevice(params: {
  ownerUserId: string;
  deviceLabel: string;
  platform?: string;
  devicePublicKey?: string;
  localVaultEligible?: boolean;
  offlineCategories?: string[];
}) {
  assertDeviceEnabled();
  const vault = await getOrCreatePersonalVault(params.ownerUserId);

  const device = await prisma.vaultDevice.create({
    data: {
      vaultId: vault.id,
      ownerUserId: params.ownerUserId,
      deviceLabel: params.deviceLabel,
      platform: params.platform,
      devicePublicKey: params.devicePublicKey,
      localVaultEligible: params.localVaultEligible ?? false,
      status: "active",
      lastUsedAt: new Date(),
      syncStatus: "registered",
    },
  });

  if (params.offlineCategories?.length) {
    await prisma.vaultDeviceCapability.create({
      data: {
        deviceId: device.id,
        scopeJson: params.offlineCategories,
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.device_registered",
    entityType: "VaultDevice",
    entityId: device.id,
    participantId: params.ownerUserId,
    metadata: {
      localVaultEligible: device.localVaultEligible,
      platform: device.platform,
    },
  });

  return device;
}

async function getOwnedDevice(deviceId: string, ownerUserId: string) {
  const device = await prisma.vaultDevice.findUnique({ where: { id: deviceId } });
  if (!device) return null;
  if (device.ownerUserId !== ownerUserId) {
    throw new VaultForbiddenError("VAULT_DEVICE_CROSS_USER");
  }
  return device;
}

export async function revokeVaultDevice(deviceId: string, ownerUserId: string) {
  assertDeviceEnabled();
  const device = await getOwnedDevice(deviceId, ownerUserId);
  if (!device) return null;

  const updated = await prisma.vaultDevice.update({
    where: { id: deviceId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      localVaultEligible: false,
      syncStatus: "revoked",
    },
  });

  await prisma.vaultDeviceCapability.updateMany({
    where: { deviceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.device_revoked",
    entityType: "VaultDevice",
    entityId: deviceId,
    participantId: ownerUserId,
  });

  return updated;
}

export async function markVaultDeviceLost(deviceId: string, ownerUserId: string) {
  assertDeviceEnabled();
  const device = await getOwnedDevice(deviceId, ownerUserId);
  if (!device) return null;

  const updated = await prisma.vaultDevice.update({
    where: { id: deviceId },
    data: {
      status: "lost",
      lostAt: new Date(),
      revokedAt: new Date(),
      localVaultEligible: false,
      remoteWipeRequestedAt: new Date(),
      syncStatus: "lost_blocked",
      riskState: "lost",
    },
  });

  await prisma.vaultDeviceCapability.updateMany({
    where: { deviceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.device_reported_lost",
    entityType: "VaultDevice",
    entityId: deviceId,
    participantId: ownerUserId,
    metadata: {
      remoteWipeLimitation:
        "Remote wipe is best-effort. Local copies may remain until the device is wiped or destroyed.",
    },
  });

  return {
    device: updated,
    limitations: [
      "Future sync to this device is blocked.",
      "Device capabilities are revoked for MapAble-controlled access.",
      "Remote deletion of offline copies is best-effort and not guaranteed.",
    ],
  };
}

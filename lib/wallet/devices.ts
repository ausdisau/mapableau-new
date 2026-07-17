import { createHash } from "node:crypto";

import type { WalletDevice, WalletDeviceTrust } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export function fingerprintDevice(input: {
  userAgent?: string;
  platform?: string;
  attestation?: Record<string, unknown>;
}): string {
  return createHash("sha256")
    .update(
      [
        input.userAgent ?? "",
        input.platform ?? "",
        JSON.stringify(input.attestation ?? {}),
      ].join("|")
    )
    .digest("hex");
}

export async function registerDevice(input: {
  walletId: string;
  deviceLabel: string;
  platform?: string;
  fingerprintHash: string;
  attestation?: Record<string, unknown>;
}): Promise<WalletDevice> {
  return prisma.walletDevice.upsert({
    where: {
      walletId_fingerprintHash: {
        walletId: input.walletId,
        fingerprintHash: input.fingerprintHash,
      },
    },
    create: {
      walletId: input.walletId,
      deviceLabel: input.deviceLabel,
      platform: input.platform ?? null,
      fingerprintHash: input.fingerprintHash,
      attestation: asJson(input.attestation),
      trust: "observed",
    },
    update: {
      deviceLabel: input.deviceLabel,
      lastSeenAt: new Date(),
    },
  });
}

export async function updateTrust(
  deviceId: string,
  trust: WalletDeviceTrust
): Promise<WalletDevice> {
  return prisma.walletDevice.update({
    where: { id: deviceId },
    data: { trust },
  });
}

export async function revokeDevice(deviceId: string): Promise<WalletDevice> {
  return prisma.walletDevice.update({
    where: { id: deviceId },
    data: { revokedAt: new Date(), trust: "revoked" },
  });
}

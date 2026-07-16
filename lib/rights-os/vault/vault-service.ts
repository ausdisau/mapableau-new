import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function getVaultSecret(): string {
  return (
    process.env.MAPABLE_RIGHTSOS_VAULT_KEY ??
    process.env.NDIS_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "dev-vault-key-not-for-production"
  );
}

export function encryptVaultPayload(plaintext: string): string {
  const key = deriveKey(getVaultSecret());
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptVaultPayload(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  const key = deriveKey(getVaultSecret());
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export async function getOrCreateVault(subjectUserId: string) {
  const existing = await prisma.personalVault.findUnique({
    where: { subjectUserId },
    include: { items: true, devices: true },
  });
  if (existing) return existing;

  return prisma.personalVault.create({
    data: { subjectUserId },
    include: { items: true, devices: true },
  });
}

export async function addVaultItem(params: {
  subjectUserId: string;
  category: string;
  source: string;
  sensitivity: string;
  fields: string[];
  payload?: Record<string, unknown>;
  permittedPurposes?: string[];
}) {
  const vault = await getOrCreateVault(params.subjectUserId);
  const encryptedPayload = params.payload
    ? encryptVaultPayload(JSON.stringify(params.payload))
    : null;

  const item = await prisma.personalVaultItem.create({
    data: {
      vaultId: vault.id,
      category: params.category,
      source: params.source,
      sensitivity: params.sensitivity,
      fieldsJson: params.fields,
      permittedPurposes: params.permittedPurposes ?? [],
      encryptedPayload,
    },
  });

  await createAuditEvent({
    actorUserId: params.subjectUserId,
    action: "rights.vault_item_added",
    entityType: "PersonalVaultItem",
    entityId: item.id,
    participantId: params.subjectUserId,
  });

  return item;
}

export async function registerVaultDevice(params: {
  subjectUserId: string;
  deviceLabel: string;
}) {
  const vault = await getOrCreateVault(params.subjectUserId);
  const device = await prisma.vaultDevice.create({
    data: {
      vaultId: vault.id,
      subjectUserId: params.subjectUserId,
      deviceLabel: params.deviceLabel,
      keyReference: randomBytes(16).toString("hex"),
    },
  });

  await createAuditEvent({
    actorUserId: params.subjectUserId,
    action: "rights.vault_device_registered",
    entityType: "VaultDevice",
    entityId: device.id,
    participantId: params.subjectUserId,
  });

  return device;
}

export async function revokeVaultDevice(deviceId: string, actorUserId: string) {
  const device = await prisma.vaultDevice.update({
    where: { id: deviceId },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "rights.vault_device_revoked",
    entityType: "VaultDevice",
    entityId: device.id,
    participantId: device.subjectUserId,
  });

  return device;
}

export async function exportVaultPackage(subjectUserId: string) {
  const vault = await getOrCreateVault(subjectUserId);
  const manifest = {
    exportedAt: new Date().toISOString(),
    subjectUserId,
    items: vault.items.map((item) => ({
      id: item.id,
      category: item.category,
      source: item.source,
      sensitivity: item.sensitivity,
      fields: item.fieldsJson,
      version: item.version,
    })),
    disclaimer:
      "This export contains participant-controlled information. Third-party information may not be included without authority.",
  };

  const record = await prisma.vaultExport.create({
    data: {
      vaultId: vault.id,
      format: "mapable_portable_vault_package",
      manifestJson: manifest,
    },
  });

  return { manifest, record };
}

import type {
  CredentialStatusList,
  IssuedCredential,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Bitstring status list support.
 *
 * IMPORTANT PRIVACY NOTE: In upstream W3C StatusList2021 / Bitstring Status
 * List drafts, an issuer publishes a public URL that any verifier can dip
 * into to check whether a given credential index is revoked. When such lists
 * are per-participant (or the indexing scheme is short), this becomes a
 * correlatable identifier and effectively leaks per-participant events to
 * anyone who scrapes the URL.
 *
 * MapAble Wave 9 therefore keeps status lists PRIVATE by default
 * (`privateOnly = true`). Lists are indexed by a MapAble-internal key, not
 * a public URL. Any operator that wants to expose a public status list MUST
 * enable `FEDERATION_STATUS_LIST_PUBLIC=true` AND document a privacy
 * assessment (see `docs/security/selective-disclosure-threat-model.md`).
 */

const BITS_PER_BYTE = 8;
const DEFAULT_SIZE = 131072;

function emptyEncoded(size: number): string {
  const bytes = Math.ceil(size / BITS_PER_BYTE);
  return Buffer.alloc(bytes, 0).toString("base64");
}

export async function getOrCreateStatusList(
  listKey: string,
  size = DEFAULT_SIZE
): Promise<CredentialStatusList> {
  const existing = await prisma.credentialStatusList.findUnique({
    where: { listKey },
  });
  if (existing) return existing;
  return prisma.credentialStatusList.create({
    data: {
      listKey,
      size,
      encodedList: emptyEncoded(size),
      privateOnly: true,
    },
  });
}

export async function assignStatusListIndex(
  credentialId: string,
  listKey = "default"
): Promise<{ list: CredentialStatusList; index: number }> {
  const list = await getOrCreateStatusList(listKey);
  const used = await prisma.issuedCredential.count({
    where: { statusListId: list.id, statusListIndex: { not: null } },
  });
  const index = used;
  await prisma.issuedCredential.update({
    where: { id: credentialId },
    data: { statusListId: list.id, statusListIndex: index },
  });
  return { list, index };
}

export async function isRevoked(
  credential: Pick<IssuedCredential, "revokedAt" | "statusListId" | "statusListIndex">
): Promise<boolean> {
  if (credential.revokedAt) return true;
  if (!credential.statusListId || credential.statusListIndex === null) {
    return false;
  }
  const list = await prisma.credentialStatusList.findUnique({
    where: { id: credential.statusListId },
  });
  if (!list) return false;
  const buffer = Buffer.from(list.encodedList, "base64");
  const byteIndex = Math.floor(credential.statusListIndex / BITS_PER_BYTE);
  const bitIndex = credential.statusListIndex % BITS_PER_BYTE;
  if (byteIndex >= buffer.length) return false;
  return (buffer[byteIndex]! & (1 << bitIndex)) !== 0;
}

export async function setRevoked(
  credentialId: string,
  revoked = true
): Promise<void> {
  const cred = await prisma.issuedCredential.findUnique({
    where: { id: credentialId },
  });
  if (!cred || !cred.statusListId || cred.statusListIndex === null) return;
  const list = await prisma.credentialStatusList.findUnique({
    where: { id: cred.statusListId },
  });
  if (!list) return;
  const buffer = Buffer.from(list.encodedList, "base64");
  const byteIndex = Math.floor(cred.statusListIndex / BITS_PER_BYTE);
  const bitIndex = cred.statusListIndex % BITS_PER_BYTE;
  if (byteIndex >= buffer.length) {
    const bigger = Buffer.alloc(byteIndex + 1);
    buffer.copy(bigger);
    bigger[byteIndex] = revoked ? 1 << bitIndex : 0;
    await prisma.credentialStatusList.update({
      where: { id: list.id },
      data: { encodedList: bigger.toString("base64") },
    });
    return;
  }
  if (revoked) {
    buffer[byteIndex] = buffer[byteIndex]! | (1 << bitIndex);
  } else {
    buffer[byteIndex] = buffer[byteIndex]! & ~(1 << bitIndex);
  }
  await prisma.credentialStatusList.update({
    where: { id: list.id },
    data: { encodedList: buffer.toString("base64") },
  });
}

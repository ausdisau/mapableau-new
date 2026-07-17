import {
  encryptNdisSensitiveJson,
  getActiveNdisEncryptionKeyVersion,
  hashNdisPayload,
  maskNdisNumber,
} from "@/lib/crypto/ndis";
import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";

export const CLAIM_PAYLOAD_CANONICALISATION_VERSION = "1";

/** Deterministic JSON stringify with sorted object keys. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeys(record[key]);
    }
    return sorted;
  }
  return value;
}

export type ExternalClaimPayload = NdiaProviderClaimPayload;

export type MaskedClaimPayload = Omit<NdiaProviderClaimPayload, "participant"> & {
  participant: {
    ndisNumber: null;
    ndisNumberMasked: string | null;
    mapableUserId: string;
  };
};

/** Identity fields included in the payload hash (volatile timestamps omitted). */
export function buildCanonicalClaimIdentity(input: {
  organisationId: string;
  participantId: string;
  fundingRoute: string;
  supportItemCodes: string[];
  servicePeriod: { start: string; end: string };
  lines: Array<{
    supportItemCode: string;
    serviceDate: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totals: { totalCents: number; currency: string };
}): string {
  return stableStringify({
    canonicalisationVersion: CLAIM_PAYLOAD_CANONICALISATION_VERSION,
    organisationId: input.organisationId,
    participantId: input.participantId,
    fundingRoute: input.fundingRoute,
    supportItemCodes: [...input.supportItemCodes].sort(),
    servicePeriod: input.servicePeriod,
    lines: input.lines.map((line) => ({
      supportItemCode: line.supportItemCode,
      serviceDate: line.serviceDate,
      quantity: Number(line.quantity),
      unitPriceCents: line.unitPriceCents,
      totalCents: line.totalCents,
    })),
    totals: {
      totalCents: input.totals.totalCents,
      currency: input.totals.currency,
    },
  });
}

export function hashCanonicalClaimIdentity(
  identity: Parameters<typeof buildCanonicalClaimIdentity>[0]
): string {
  return hashNdisPayload(buildCanonicalClaimIdentity(identity));
}

export function toMaskedClaimPayload(
  payload: ExternalClaimPayload
): MaskedClaimPayload {
  const masked =
    payload.participant.ndisNumberMasked ??
    (payload.participant.ndisNumber
      ? maskNdisNumber(payload.participant.ndisNumber)
      : null);
  return {
    ...payload,
    participant: {
      ndisNumber: null,
      ndisNumberMasked: masked,
      mapableUserId: payload.participant.mapableUserId,
    },
    metadata: {
      ...payload.metadata,
      // Drop volatile builtAt from masked ordinary JSON identity display optional.
    },
  };
}

export function encryptExternalClaimPayload(
  payload: ExternalClaimPayload,
  organisationId: string
): { ciphertext: string; encryptionKeyVersion: string } {
  const aad = `ndis-claim:${organisationId}`;
  return {
    ciphertext: encryptNdisSensitiveJson(payload, aad),
    encryptionKeyVersion: getActiveNdisEncryptionKeyVersion(),
  };
}

export function looksLikeRawNdisNumber(value: unknown): boolean {
  return typeof value === "string" && /^\d{9}$/.test(value.trim());
}

export function payloadContainsRawNdisNumber(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const participant = record.participant as Record<string, unknown> | undefined;
  if (participant && looksLikeRawNdisNumber(participant.ndisNumber)) {
    return true;
  }
  if (looksLikeRawNdisNumber(record.ndisNumber)) return true;
  if (looksLikeRawNdisNumber(record.ndisParticipantNumber)) return true;
  return false;
}

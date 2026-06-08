import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";

import { getNdiaHttpConfig } from "./config";

export type NdiaMappedSubmitResponse = {
  externalClaimId: string;
  externalStatus: string;
  raw: unknown;
};

export type NdiaMappedStatusResponse = {
  status: string;
  raw: unknown;
};

function pickFirstField(
  record: Record<string, unknown>,
  fields: string[]
): string | undefined {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

/** Map internal claim payload to NDIA partner API request body. */
export function mapProviderClaimToNdiaRequest(
  payload: NdiaProviderClaimPayload
): Record<string, unknown> {
  const format = process.env.NDIA_PAYLOAD_FORMAT ?? "pace_v1";

  if (format === "internal") {
    return payload as unknown as Record<string, unknown>;
  }

  return {
    claimType: payload.claimType,
    provider: {
      registrationNumber: payload.provider.ndisRegistrationNumber,
      abn: payload.provider.abn,
      organisationId: payload.provider.organisationId,
      name: payload.provider.name,
    },
    participant: {
      ndisNumber: payload.participant.ndisNumber,
      externalReference: payload.participant.mapableUserId,
    },
    invoiceReference: payload.invoiceReference,
    servicePeriod: payload.servicePeriod,
    lineItems: payload.lines.map((line) => ({
      lineNumber: line.lineNumber,
      supportItemNumber: line.supportItemCode,
      description: line.description,
      serviceDate: line.serviceDate,
      quantity: line.quantity,
      unitPrice: line.unitPriceCents / 100,
      lineTotal: line.totalCents / 100,
      gstIncluded: line.gstIncluded,
    })),
    totals: {
      subtotal: payload.totals.subtotalCents / 100,
      tax: payload.totals.taxCents / 100,
      total: payload.totals.totalCents / 100,
      currency: payload.totals.currency,
    },
    metadata: payload.metadata,
  };
}

export function mapBatchClaimToNdiaRequest(params: {
  batchReference: string;
  providerRegistrationNumber: string;
  organisationId: string;
  organisationName: string;
  lines: Array<{
    participantNumber: string;
    participantName: string;
    supportItemCode: string;
    supportDescription: string;
    serviceStartDate: string;
    serviceEndDate: string;
    quantity: number;
    unitPriceCents: number;
    totalAmountCents: number;
    claimReference: string;
  }>;
}): Record<string, unknown> {
  const totalCents = params.lines.reduce((sum, l) => sum + l.totalAmountCents, 0);

  return {
    claimType: "registered_provider_batch",
    batchReference: params.batchReference,
    provider: {
      registrationNumber: params.providerRegistrationNumber,
      organisationId: params.organisationId,
      name: params.organisationName,
    },
    lineItems: params.lines.map((line, index) => ({
      lineNumber: index + 1,
      participantNumber: line.participantNumber,
      participantName: line.participantName,
      supportItemNumber: line.supportItemCode,
      description: line.supportDescription,
      servicePeriod: {
        start: line.serviceStartDate,
        end: line.serviceEndDate,
      },
      quantity: line.quantity,
      unitPrice: line.unitPriceCents / 100,
      lineTotal: line.totalAmountCents / 100,
      claimReference: line.claimReference,
    })),
    totals: {
      total: totalCents / 100,
      currency: "AUD",
    },
    metadata: {
      builtAt: new Date().toISOString(),
      mapableVersion: "1",
    },
  };
}

export function mapNdiaSubmitResponse(body: unknown): NdiaMappedSubmitResponse {
  const config = getNdiaHttpConfig();
  const record =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const externalClaimId =
    pickFirstField(record, config.responseClaimIdFields) ??
    `ndia_${Date.now()}`;

  const externalStatus =
    pickFirstField(record, config.responseStatusFields) ?? "submitted";

  return { externalClaimId, externalStatus, raw: body };
}

export function mapNdiaStatusResponse(body: unknown): NdiaMappedStatusResponse {
  const config = getNdiaHttpConfig();
  const record =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const status =
    pickFirstField(record, config.responseStatusFields) ?? "unknown";

  return { status, raw: body };
}

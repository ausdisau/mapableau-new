import { createHash } from "crypto";

import type { PublicationVisibility } from "@prisma/client";

import { redactPublicRegisterPayload } from "@/lib/public-interest-governance/publication/redaction";
import { prisma } from "@/lib/prisma";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

export function hashPublicPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export async function appendPublicRegisterPublication(params: {
  entryId?: string;
  kind: string;
  payload: unknown;
  visibility?: PublicationVisibility;
  publishedAt?: Date;
}) {
  const redactedPayload = redactPublicRegisterPayload(params.payload);
  return prisma.publicRegisterPublication.create({
    data: {
      entryId: params.entryId,
      kind: params.kind,
      payloadHash: hashPublicPayload(redactedPayload),
      visibility: params.visibility ?? "public",
      publishedAt: params.publishedAt ?? new Date(),
    },
  });
}

export async function listPublicRegisterPublications(params?: {
  entryId?: string;
  visibility?: PublicationVisibility;
}) {
  return prisma.publicRegisterPublication.findMany({
    where: params,
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
}

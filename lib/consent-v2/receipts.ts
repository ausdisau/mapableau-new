import { createHash } from "node:crypto";

import type { ConsentDirective, ConsentReceipt } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Consent receipts are hash-chained per directive. Each new receipt for a
 * directive stores `previousHash = last.receiptHash`. Participants (and
 * auditors) can verify the chain has not been tampered with by re-computing
 * the sha256 over `contents` and confirming `previousHash` matches the prior
 * receipt.
 *
 * Receipts are NEVER used to convey the underlying data payload — they are
 * a purpose + scope + timestamp attestation intended for auditability.
 */

function hashContents(contents: unknown): string {
  const json = JSON.stringify(contents, Object.keys(contents ?? {}).sort());
  return createHash("sha256").update(json).digest("hex");
}

export async function issueReceiptForDirective(
  directive: ConsentDirective,
  issuedToId: string
): Promise<ConsentReceipt> {
  const previous = await prisma.consentReceipt.findFirst({
    where: { directiveId: directive.id },
    orderBy: { issuedAt: "desc" },
    select: { receiptHash: true },
  });

  const contents = {
    directiveId: directive.id,
    version: directive.version,
    subjectId: directive.subjectId,
    recipientCategory: directive.recipientCategory,
    recipientOrganisationId: directive.recipientOrganisationId,
    recipientEntityId: directive.recipientEntityId,
    purpose: directive.purpose,
    purposeDetail: directive.purposeDetail,
    scopeKeys: directive.scopeKeys ?? [],
    frequency: directive.frequency,
    decision: directive.decision,
    effectiveFrom: directive.effectiveFrom?.toISOString?.() ?? null,
    effectiveUntil: directive.effectiveUntil?.toISOString?.() ?? null,
  };

  const receiptHash = hashContents({
    previousHash: previous?.receiptHash ?? null,
    contents,
  });

  const humanSummary = buildHumanSummary(directive);

  return prisma.consentReceipt.create({
    data: {
      directiveId: directive.id,
      issuedToId,
      receiptHash,
      previousHash: previous?.receiptHash ?? null,
      humanSummary,
      contents,
    },
  });
}

function buildHumanSummary(directive: ConsentDirective): string {
  const decisionText =
    directive.decision === "active"
      ? "granted"
      : directive.decision === "withdrawn"
        ? "withdrawn"
        : directive.decision === "denied"
          ? "denied"
          : directive.decision === "expired"
            ? "expired"
            : "superseded";
  return [
    `You ${decisionText} consent for "${directive.purpose}"`,
    `to ${directive.recipientCategory}`,
    directive.recipientOrganisationId
      ? `(org ${directive.recipientOrganisationId})`
      : "",
    `— ${directive.frequency}.`,
    directive.effectiveUntil
      ? `Expires ${directive.effectiveUntil.toISOString().slice(0, 10)}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Verify chain integrity for a given directive. Returns null when OK. */
export async function verifyReceiptChain(
  directiveId: string
): Promise<{ ok: true } | { ok: false; brokenAtId: string; reason: string }> {
  const receipts = await prisma.consentReceipt.findMany({
    where: { directiveId },
    orderBy: { issuedAt: "asc" },
  });

  let previousHash: string | null = null;
  for (const receipt of receipts) {
    if ((receipt.previousHash ?? null) !== previousHash) {
      return {
        ok: false,
        brokenAtId: receipt.id,
        reason: "previousHash_mismatch",
      };
    }
    const expected = hashContents({
      previousHash,
      contents: receipt.contents,
    });
    if (expected !== receipt.receiptHash) {
      return {
        ok: false,
        brokenAtId: receipt.id,
        reason: "receiptHash_mismatch",
      };
    }
    previousHash = receipt.receiptHash;
  }
  return { ok: true };
}

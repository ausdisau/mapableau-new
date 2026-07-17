/**
 * Backfill privacy-safe claim snapshots from legacy claim records.
 *
 * Usage:
 *   pnpm backfill:ndis-claim-snapshots -- --dry-run
 *   pnpm backfill:ndis-claim-snapshots -- --organisationId=<id> --batchSize=50
 *
 * Never prints participant NDIS numbers or payload contents.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { decryptNdisNumber, maskNdisNumber } from "@/lib/crypto/ndis";
import {
  encryptExternalClaimPayload,
  hashCanonicalClaimIdentity,
  payloadContainsRawNdisNumber,
  toMaskedClaimPayload,
  type ExternalClaimPayload,
} from "@/lib/ndis-gateway/security/sensitive-payload";
import { prisma } from "@/lib/prisma";

type Args = {
  dryRun: boolean;
  organisationId?: string;
  sourceType?: string;
  batchSize: number;
  cursor?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, batchSize: 50 };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--organisationId="))
      args.organisationId = arg.slice("--organisationId=".length);
    else if (arg.startsWith("--sourceType="))
      args.sourceType = arg.slice("--sourceType=".length);
    else if (arg.startsWith("--batchSize="))
      args.batchSize = Number(arg.slice("--batchSize=".length)) || 50;
    else if (arg.startsWith("--cursor="))
      args.cursor = arg.slice("--cursor=".length);
  }
  return args;
}

type Report = {
  dryRun: boolean;
  processedProviderClaims: number;
  processedClaimLines: number;
  snapshotsCreated: number;
  privacyReviewRequired: number;
  skippedAlreadyLinked: number;
  errors: Array<{ sourceType: string; sourceId: string; code: string }>;
  ids: {
    privacyReview: string[];
    createdSnapshots: string[];
  };
};

async function buildExternalFromProviderClaim(claim: {
  id: string;
  organisationId: string;
  participantId: string;
  claimPayloadJson: unknown;
  ndisRegistrationNumber: string;
}): Promise<{
  payload: ExternalClaimPayload;
  fundingRoute: string;
  privacyReviewRequired: boolean;
}> {
  const stored = claim.claimPayloadJson as ExternalClaimPayload;
  const privacyReviewRequired = payloadContainsRawNdisNumber(stored);
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: claim.participantId },
  });
  const ndisNumber = profile?.ndisParticipantNumberEnc
    ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
    : null;

  const masked = toMaskedClaimPayload({
    ...stored,
    participant: {
      ...stored.participant,
      ndisNumber: null,
      ndisNumberMasked:
        stored.participant?.ndisNumberMasked ??
        (ndisNumber ? maskNdisNumber(ndisNumber) : null),
      mapableUserId: claim.participantId,
    },
    provider: {
      ...stored.provider,
      ndisRegistrationNumber:
        stored.provider?.ndisRegistrationNumber || claim.ndisRegistrationNumber,
      organisationId: claim.organisationId,
    },
  });

  return {
    payload: {
      ...masked,
      participant: { ...masked.participant, ndisNumber },
    },
    fundingRoute: "ndia_managed",
    privacyReviewRequired: privacyReviewRequired || !ndisNumber,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report: Report = {
    dryRun: args.dryRun,
    processedProviderClaims: 0,
    processedClaimLines: 0,
    snapshotsCreated: 0,
    privacyReviewRequired: 0,
    skippedAlreadyLinked: 0,
    errors: [],
    ids: { privacyReview: [], createdSnapshots: [] },
  };

  if (!args.sourceType || args.sourceType === "ndia_provider_claim") {
    const claims = await prisma.ndiaProviderClaim.findMany({
      where: {
        organisationId: args.organisationId,
        ...(args.cursor ? { id: { gt: args.cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: args.batchSize,
    });

    for (const claim of claims) {
      report.processedProviderClaims += 1;
      if (claim.currentSnapshotId) {
        report.skippedAlreadyLinked += 1;
        continue;
      }
      try {
        const built = await buildExternalFromProviderClaim(claim);
        const supportItemCodes = built.payload.lines.map((l) => l.supportItemCode);
        const payloadHash = hashCanonicalClaimIdentity({
          organisationId: claim.organisationId,
          participantId: claim.participantId,
          fundingRoute: built.fundingRoute,
          supportItemCodes,
          servicePeriod: built.payload.servicePeriod,
          lines: built.payload.lines.map((l) => ({
            supportItemCode: l.supportItemCode,
            serviceDate: l.serviceDate,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            totalCents: l.totalCents,
          })),
          totals: {
            totalCents: built.payload.totals.totalCents,
            currency: built.payload.totals.currency,
          },
        });
        const { ciphertext, encryptionKeyVersion } = encryptExternalClaimPayload(
          built.payload,
          claim.organisationId
        );
        const masked = toMaskedClaimPayload(built.payload);

        if (!args.dryRun) {
          const snapshot = await prisma.ndisClaimSnapshot.create({
            data: {
              organisationId: claim.organisationId,
              participantId: claim.participantId,
              sourceType: "ndia_provider_claim",
              sourceId: claim.id,
              schemaVersion: "1",
              maskedPayloadJson: masked as object,
              encryptedPayloadCiphertext: ciphertext,
              payloadHash,
              encryptionKeyVersion,
              supportItemCodes,
              totalCents: built.payload.totals.totalCents,
              currency: built.payload.totals.currency,
              fundingRoute: built.fundingRoute,
              createdById: claim.createdById,
              privacyReviewRequired: built.privacyReviewRequired,
            },
          });
          await prisma.ndiaProviderClaim.update({
            where: { id: claim.id },
            data: {
              currentSnapshotId: snapshot.id,
              payloadHash,
              claimPayloadJson: masked as object,
            },
          });
          report.ids.createdSnapshots.push(snapshot.id);
          if (built.privacyReviewRequired) {
            report.ids.privacyReview.push(claim.id);
          }
        }

        report.snapshotsCreated += 1;
        if (built.privacyReviewRequired) report.privacyReviewRequired += 1;
      } catch {
        report.errors.push({
          sourceType: "ndia_provider_claim",
          sourceId: claim.id,
          code: "BACKFILL_FAILED",
        });
      }
    }
  }

  if (!args.sourceType || args.sourceType === "ndis_claim_line") {
    const lines = await prisma.ndisClaimLine.findMany({
      where: {
        providerOrgId: args.organisationId,
        ...(args.cursor ? { id: { gt: args.cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: args.batchSize,
    });

    for (const line of lines) {
      report.processedClaimLines += 1;
      if (line.currentSnapshotId) {
        report.skippedAlreadyLinked += 1;
        continue;
      }
      try {
        const profile = await prisma.participantProfile.findUnique({
          where: { userId: line.participantId },
        });
        const ndisNumber = profile?.ndisParticipantNumberEnc
          ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
          : null;
        const org = await prisma.organisation.findUnique({
          where: { id: line.providerOrgId },
        });
        const fundingRoute = line.paymentRoute;
        const payload: ExternalClaimPayload = {
          claimType: "registered_provider",
          provider: {
            abn: org?.abn ?? null,
            ndisRegistrationNumber: org?.ndisRegistrationNumber ?? "",
            organisationId: line.providerOrgId,
            name: org?.name ?? "",
          },
          participant: {
            ndisNumber,
            ndisNumberMasked: line.ndisParticipantNumber,
            mapableUserId: line.participantId,
          },
          invoiceReference: {},
          servicePeriod: {
            start: line.serviceStartDate.toISOString().slice(0, 10),
            end: line.serviceEndDate.toISOString().slice(0, 10),
          },
          lines: [
            {
              lineNumber: 1,
              supportItemCode: line.supportItemCode,
              description: line.supportDescription,
              serviceDate: line.serviceStartDate.toISOString().slice(0, 10),
              quantity: Number(line.quantity),
              unitPriceCents: line.unitPriceCents,
              totalCents: line.totalAmountCents,
              gstIncluded: false,
            },
          ],
          totals: {
            subtotalCents: line.totalAmountCents,
            taxCents: 0,
            totalCents: line.totalAmountCents,
            currency: "AUD",
          },
          metadata: { builtAt: new Date().toISOString(), mapableVersion: "1" },
        };
        const privacyReviewRequired = !ndisNumber;
        const supportItemCodes = [line.supportItemCode];
        const payloadHash = hashCanonicalClaimIdentity({
          organisationId: line.providerOrgId,
          participantId: line.participantId,
          fundingRoute,
          supportItemCodes,
          servicePeriod: payload.servicePeriod,
          lines: payload.lines.map((l) => ({
            supportItemCode: l.supportItemCode,
            serviceDate: l.serviceDate,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            totalCents: l.totalCents,
          })),
          totals: {
            totalCents: payload.totals.totalCents,
            currency: payload.totals.currency,
          },
        });
        const { ciphertext, encryptionKeyVersion } = encryptExternalClaimPayload(
          payload,
          line.providerOrgId
        );
        const masked = toMaskedClaimPayload(payload);

        if (!args.dryRun) {
          const snapshot = await prisma.ndisClaimSnapshot.create({
            data: {
              organisationId: line.providerOrgId,
              participantId: line.participantId,
              sourceType: "ndis_claim_line",
              sourceId: line.id,
              schemaVersion: "1",
              maskedPayloadJson: masked as object,
              encryptedPayloadCiphertext: ciphertext,
              payloadHash,
              encryptionKeyVersion,
              supportItemCodes,
              totalCents: line.totalAmountCents,
              currency: "AUD",
              fundingRoute,
              createdById: line.createdById,
              privacyReviewRequired,
            },
          });
          await prisma.ndisClaimLine.update({
            where: { id: line.id },
            data: {
              currentSnapshotId: snapshot.id,
              payloadHash,
              ndisParticipantNumber: masked.participant.ndisNumberMasked,
            },
          });
          report.ids.createdSnapshots.push(snapshot.id);
          if (privacyReviewRequired) report.ids.privacyReview.push(line.id);
        }
        report.snapshotsCreated += 1;
        if (privacyReviewRequired) report.privacyReviewRequired += 1;
      } catch {
        report.errors.push({
          sourceType: "ndis_claim_line",
          sourceId: line.id,
          code: "BACKFILL_FAILED",
        });
      }
    }
  }

  const outDir = path.join(process.cwd(), "artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "ndis-claim-backfill-report.json");
  await writeFile(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: report.dryRun,
        processedProviderClaims: report.processedProviderClaims,
        processedClaimLines: report.processedClaimLines,
        snapshotsCreated: report.snapshotsCreated,
        privacyReviewRequired: report.privacyReviewRequired,
        skippedAlreadyLinked: report.skippedAlreadyLinked,
        errorCount: report.errors.length,
        reportPath: outPath,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      ok: false,
      code: "BACKFILL_FATAL",
      message: err instanceof Error ? err.message : "unknown",
    })
  );
  process.exit(1);
});

import type { VerificationStatus } from "@prisma/client";

import {
  AbnLookupError,
  lookupAbn,
  scoreNameMatch,
} from "@/lib/abn-lookup";
import { abrLookupConfig } from "@/lib/abn-lookup/config";
import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";
import type { AbnCheckNotes } from "@/lib/abn-lookup/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export type AbnCheckStatus = "pending" | "passed" | "failed" | "error";

const DEFAULT_CHECK_TYPES = ["abn"] as const;

export async function seedDefaultChecks(caseId: string) {
  const existing = await prisma.providerVerificationCheck.findMany({
    where: { caseId },
    select: { checkType: true },
  });
  const have = new Set(existing.map((c) => c.checkType));

  for (const checkType of DEFAULT_CHECK_TYPES) {
    if (have.has(checkType)) continue;
    await prisma.providerVerificationCheck.create({
      data: { caseId, checkType, status: "pending" },
    });
  }
}

function deriveCheckStatus(params: {
  lookupOk: boolean;
  entityActive: boolean;
  namePassed: boolean;
  hasAbn: boolean;
}): AbnCheckStatus {
  if (!params.hasAbn || !params.lookupOk) return "failed";
  if (!params.entityActive) return "failed";
  if (!params.namePassed) return "failed";
  return "passed";
}

function orgStatusFromAbnCheck(status: AbnCheckStatus): VerificationStatus | null {
  if (status === "failed") return "pending_review";
  return null;
}

export async function runAbnCheckForCase(caseId: string, actorUserId: string) {
  if (!phase5Config.providerVerificationAdvancedEnabled) {
    throw new Error("VERIFICATION_DISABLED");
  }

  const verificationCase = await prisma.providerVerificationCase.findUnique({
    where: { id: caseId },
    include: {
      organisation: { select: { id: true, name: true, abn: true } },
      checks: { where: { checkType: "abn" } },
    },
  });

  if (!verificationCase) {
    throw new Error("CASE_NOT_FOUND");
  }

  const org = verificationCase.organisation;
  const abnDigits = org.abn ? normalizeAbnDigits(org.abn) : "";

  let checkStatus: AbnCheckStatus = "error";
  let notes: AbnCheckNotes;

  try {
    if (!abnDigits) {
      checkStatus = "failed";
      notes = {
        checkedAt: new Date().toISOString(),
        mode: abrLookupConfig.adapterMode === "http" ? "http" : "mock",
        abn: "",
        entityName: null,
        entityStatus: "Unknown",
        entityType: null,
        gstRegistered: null,
        nameMatch: {
          matchScore: 0,
          matchReason: "Organisation has no ABN on file",
          passed: false,
        },
        message: "ABN required",
      };
    } else {
      const lookup = await lookupAbn(abnDigits);
      const nameMatch = scoreNameMatch(lookup.entityName, [org.name]);
      const entityActive = lookup.entityStatus === "Active";

      checkStatus = deriveCheckStatus({
        lookupOk: !lookup.exceptionCode,
        entityActive,
        namePassed: nameMatch.passed,
        hasAbn: true,
      });

      notes = {
        checkedAt: new Date().toISOString(),
        mode: lookup.mode,
        abn: lookup.abn,
        entityName: lookup.entityName,
        entityStatus: lookup.entityStatus,
        entityType: lookup.entityType,
        gstRegistered: lookup.gstRegistered,
        nameMatch,
        message: lookup.message ?? lookup.exceptionDescription,
      };
    }
  } catch (e) {
    checkStatus = "error";
    const message =
      e instanceof AbnLookupError
        ? e.message
        : e instanceof Error
          ? e.message
          : "ABN lookup failed";
    notes = {
      checkedAt: new Date().toISOString(),
      mode: abrLookupConfig.adapterMode === "http" ? "http" : "mock",
      abn: abnDigits,
      entityName: null,
      entityStatus: "Unknown",
      entityType: null,
      gstRegistered: null,
      nameMatch: {
        matchScore: 0,
        matchReason: message,
        passed: false,
      },
      message,
    };
  }

  const notesJson = JSON.stringify(notes);

  const existingAbnCheck = verificationCase.checks[0];
  if (existingAbnCheck) {
    await prisma.providerVerificationCheck.update({
      where: { id: existingAbnCheck.id },
      data: { status: checkStatus, notes: notesJson },
    });
  } else {
    await prisma.providerVerificationCheck.create({
      data: {
        caseId,
        checkType: "abn",
        status: checkStatus,
        notes: notesJson,
      },
    });
  }

  const newOrgStatus = orgStatusFromAbnCheck(checkStatus);
  if (newOrgStatus) {
    await prisma.organisation.update({
      where: { id: org.id },
      data: { verificationStatus: newOrgStatus },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "verification.abn_check_completed",
    entityType: "ProviderVerificationCase",
    entityId: caseId,
    organisationId: org.id,
    metadata: {
      checkStatus,
      abn: notes.abn,
      entityStatus: notes.entityStatus,
      nameMatchScore: notes.nameMatch.matchScore,
    },
  });

  return {
    caseId,
    checkStatus,
    notes,
  };
}

export async function canAutoAdvanceCase(caseId: string): Promise<boolean> {
  const abnCheck = await prisma.providerVerificationCheck.findFirst({
    where: { caseId, checkType: "abn" },
  });
  return abnCheck?.status === "passed";
}

export async function getLatestAbnCheckForOrganisation(organisationId: string) {
  const verificationCase = await prisma.providerVerificationCase.findFirst({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    include: {
      checks: { where: { checkType: "abn" }, take: 1 },
    },
  });
  if (!verificationCase?.checks[0]) return null;

  const check = verificationCase.checks[0];
  let notes: AbnCheckNotes | null = null;
  if (check.notes) {
    try {
      notes = JSON.parse(check.notes) as AbnCheckNotes;
    } catch {
      notes = null;
    }
  }

  return {
    caseId: verificationCase.id,
    caseStatus: verificationCase.status,
    checkStatus: check.status as AbnCheckStatus,
    notes,
  };
}

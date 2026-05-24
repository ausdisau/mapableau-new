import {
  AbnLookupError,
  lookupAbn,
  scoreNameMatch,
} from "@/lib/abn-lookup";
import { abrLookupConfig } from "@/lib/abn-lookup/config";
import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type CredentialCheck = {
  field: string;
  status: string;
  required: boolean;
  passed: boolean;
};

export type ContractorAbnCheck = {
  abn: string;
  status: "skipped" | "passed" | "failed" | "error";
  entityName: string | null;
  entityStatus: string | null;
  nameMatchScore: number | null;
  message: string | null;
};

export type WorkerVerificationSummary = {
  workerId: string;
  organisationId: string;
  credentials: CredentialCheck[];
  contractorAbn: ContractorAbnCheck;
  recommendation: "verified" | "pending_review" | "rejected";
  allCredentialsPassed: boolean;
  contractorAbnPassed: boolean;
};

const REQUIRED_CREDENTIALS = [
  { field: "workerScreeningStatus", label: "Worker screening" },
  { field: "wwccStatus", label: "WWCC" },
] as const;

function credentialPassed(status: string): boolean {
  return status === "verified";
}

export function deriveWorkerVerificationRecommendation(
  credentials: CredentialCheck[],
  contractorAbn: ContractorAbnCheck
): "verified" | "pending_review" | "rejected" {
  const requiredCreds = credentials.filter((c) => c.required);
  const anyRejected = credentials.some((c) => c.status === "rejected");
  if (anyRejected) return "rejected";

  const allRequiredPassed = requiredCreds.every((c) => c.passed);
  const abnOk =
    contractorAbn.status === "skipped" || contractorAbn.status === "passed";

  if (allRequiredPassed && abnOk) return "verified";
  return "pending_review";
}

export async function runWorkerVerificationChecks(
  workerId: string,
  actorUserId: string
): Promise<WorkerVerificationSummary> {
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    include: { organisation: { select: { name: true } } },
  });

  if (!profile) {
    throw new Error("WORKER_NOT_FOUND");
  }

  const credentials: CredentialCheck[] = [
    ...REQUIRED_CREDENTIALS.map(({ field, label }) => {
      const status = profile[field] as string;
      return {
        field: label,
        status,
        required: true,
        passed: credentialPassed(status),
      };
    }),
    {
      field: "First aid",
      status: profile.firstAidStatus,
      required: false,
      passed: credentialPassed(profile.firstAidStatus),
    },
    {
      field: "Insurance",
      status: profile.insuranceStatus,
      required: false,
      passed: credentialPassed(profile.insuranceStatus),
    },
  ];

  let contractorAbn: ContractorAbnCheck = {
    abn: "",
    status: "skipped",
    entityName: null,
    entityStatus: null,
    nameMatchScore: null,
    message: null,
  };

  const contractorDigits = profile.contractorAbn
    ? normalizeAbnDigits(profile.contractorAbn)
    : "";

  if (contractorDigits) {
    try {
      const lookup = await lookupAbn(contractorDigits);
      const nameMatch = scoreNameMatch(lookup.entityName, [
        profile.displayName,
        profile.organisation.name,
      ]);
      const entityActive = lookup.entityStatus === "Active";
      const passed =
        entityActive && nameMatch.passed && !lookup.exceptionCode;

      contractorAbn = {
        abn: lookup.abn,
        status: passed ? "passed" : "failed",
        entityName: lookup.entityName,
        entityStatus: lookup.entityStatus,
        nameMatchScore: nameMatch.matchScore,
        message: lookup.message ?? nameMatch.matchReason,
      };
    } catch (e) {
      contractorAbn = {
        abn: contractorDigits,
        status: "error",
        entityName: null,
        entityStatus: null,
        nameMatchScore: null,
        message:
          e instanceof AbnLookupError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Contractor ABN lookup failed",
      };
    }
  }

  const allCredentialsPassed = credentials
    .filter((c) => c.required)
    .every((c) => c.passed);
  const contractorAbnPassed =
    contractorAbn.status === "skipped" || contractorAbn.status === "passed";

  const recommendation = deriveWorkerVerificationRecommendation(
    credentials,
    contractorAbn
  );

  await createAuditEvent({
    actorUserId,
    action: "worker_profile.verification_checks_run",
    entityType: "WorkerProfile",
    entityId: workerId,
    organisationId: profile.organisationId,
    metadata: {
      recommendation,
      contractorAbnStatus: contractorAbn.status,
      mode: abrLookupConfig.adapterMode,
    },
  });

  return {
    workerId,
    organisationId: profile.organisationId,
    credentials,
    contractorAbn,
    recommendation,
    allCredentialsPassed,
    contractorAbnPassed,
  };
}

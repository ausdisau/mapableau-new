import type { AssuranceExceptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ExceptionUsability = {
  usable: boolean;
  reason: string;
};

export function evaluateExceptionUsability(exception: {
  status: AssuranceExceptionStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
}, now = new Date()): ExceptionUsability {
  if (exception.status === "proposed") {
    return { usable: false, reason: "exception_not_approved" };
  }
  if (exception.status === "rejected" || exception.status === "revoked") {
    return { usable: false, reason: `exception_${exception.status}` };
  }
  if (exception.status === "expired") {
    return { usable: false, reason: "exception_expired" };
  }
  if (exception.revokedAt) {
    return { usable: false, reason: "exception_revoked" };
  }
  if (exception.expiresAt && exception.expiresAt.getTime() < now.getTime()) {
    return { usable: false, reason: "exception_expired" };
  }
  if (exception.status !== "approved") {
    return { usable: false, reason: "exception_unusable" };
  }
  return { usable: true, reason: "exception_approved_current" };
}

export async function createException(params: {
  controlId: string;
  title: string;
  rationale: string;
  organisationId?: string | null;
  compensatingControls?: string | null;
  expiresAt?: Date | null;
  createdById?: string | null;
}) {
  if (!params.rationale.trim()) {
    throw new Error("EXCEPTION_RATIONALE_REQUIRED");
  }

  return prisma.assuranceException.create({
    data: {
      controlId: params.controlId,
      title: params.title,
      rationale: params.rationale,
      organisationId: params.organisationId ?? null,
      compensatingControls: params.compensatingControls ?? null,
      expiresAt: params.expiresAt ?? null,
      createdById: params.createdById ?? null,
      status: "proposed",
    },
  });
}

export async function approveException(params: {
  exceptionId: string;
  approvedById: string;
  expiresAt?: Date | null;
}) {
  return prisma.assuranceException.update({
    where: { id: params.exceptionId },
    data: {
      status: "approved",
      approvedById: params.approvedById,
      approvedAt: new Date(),
      expiresAt: params.expiresAt ?? undefined,
    },
  });
}

export async function listExceptions(params?: {
  controlId?: string;
  organisationId?: string;
}) {
  const rows = await prisma.assuranceException.findMany({
    where: {
      controlId: params?.controlId,
      organisationId: params?.organisationId,
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...row,
    usability: evaluateExceptionUsability(row),
  }));
}

/** Empty or expired exceptions never support approval/readiness. */
export function exceptionsSupportApproval(
  exceptions: Array<{
    status: AssuranceExceptionStatus;
    expiresAt: Date | null;
    revokedAt: Date | null;
  }>
): boolean {
  if (exceptions.length === 0) return false;
  return exceptions.some((e) => evaluateExceptionUsability(e).usable);
}

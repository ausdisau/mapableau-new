import type { CurrentUser } from "@/lib/auth/current-user";
import { recordAcademyAudit } from "@/lib/academy/audit";
import {
  COMPLETION_CERTIFICATE_LABEL,
  HIS_PRACTICAL_WARNING,
  STANDARD_CREDENTIAL_TYPE,
  getAcademyConfig,
} from "@/lib/academy/config";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import { prisma } from "@/lib/prisma";

export async function issueCompletionCredential(
  user: CurrentUser,
  enrolmentId: string,
) {
  const config = getAcademyConfig();
  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
    include: {
      courseVersion: { include: { course: { include: { school: true } } } },
      user: { select: { id: true, name: true } },
    },
  });

  const course = enrolment.courseVersion.course;
  if (course.practicalAssessmentRequired || course.school?.code === "HIS") {
    throw new AcademyAuthzError(
      `${HIS_PRACTICAL_WARNING} Online theory completion cannot issue competency.`,
    );
  }

  const existing = await prisma.academyCredential.findFirst({
    where: { enrolmentId, status: "issued" },
  });
  if (existing) return existing;

  const learner = await prisma.learnerProfile.findUnique({
    where: { userId: enrolment.userId },
  });

  const expiresAt =
    config.defaultCredentialExpiryDays != null
      ? new Date(
          Date.now() + config.defaultCredentialExpiryDays * 24 * 60 * 60 * 1000,
        )
      : null;

  const credential = await prisma.academyCredential.create({
    data: {
      userId: enrolment.userId,
      enrolmentId,
      courseVersionId: enrolment.courseVersionId,
      issuerName: config.issuerName,
      achievementTitle: `${STANDARD_CREDENTIAL_TYPE} ${enrolment.courseVersion.title}`,
      status: "issued",
      expiresAt: expiresAt ?? undefined,
      evidenceSummary: `Completed course version ${enrolment.courseVersion.versionNumber} of ${course.code}. ${COMPLETION_CERTIFICATE_LABEL} only — not an AQF outcome.`,
      verificationStatus: "verifiable",
      publicDisplay: Boolean(learner?.publicCredentialsOptIn),
      expiry: expiresAt
        ? { create: { expiresAt } }
        : undefined,
    },
  });

  await recordAcademyAudit({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "academy.credential.issued",
    entityType: "AcademyCredential",
    entityId: credential.id,
    metadata: {
      publicId: credential.publicId,
      courseVersionId: enrolment.courseVersionId,
      courseCode: course.code,
    },
  });

  return credential;
}

export async function revokeCredential(
  actor: CurrentUser,
  credentialId: string,
  reason: string,
) {
  const credential = await prisma.academyCredential.update({
    where: { id: credentialId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      revocationReason: reason,
      verificationStatus: "revoked",
      publicDisplay: false,
    },
  });

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.credential.revoked",
    entityType: "AcademyCredential",
    entityId: credential.id,
    metadata: { publicId: credential.publicId, reason },
  });

  return credential;
}

/** Public verification — minimum necessary fields only. */
export async function verifyCredentialPublic(publicId: string) {
  const credential = await prisma.academyCredential.findUnique({
    where: { publicId },
    include: {
      courseVersion: {
        select: {
          versionNumber: true,
          title: true,
          course: { select: { code: true, slug: true } },
        },
      },
      user: { select: { name: true } },
      expiry: true,
    },
  });

  if (!credential) return null;

  const showName =
    credential.publicDisplay &&
    credential.status === "issued" &&
    !credential.revokedAt;

  return {
    publicId: credential.publicId,
    issuer: credential.issuerName,
    achievement: credential.achievementTitle,
    certificateType: COMPLETION_CERTIFICATE_LABEL,
    courseCode: credential.courseVersion.course.code,
    courseVersion: credential.courseVersion.versionNumber,
    courseTitle: credential.courseVersion.title,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt ?? credential.expiry?.expiresAt ?? null,
    verificationStatus: credential.verificationStatus,
    status: credential.status,
    learnerDisplayName: showName ? credential.user.name : null,
    disclaimer:
      "This is a MapAble Academy Certificate of Completion. It is not an AQF qualification, Statement of Attainment, or guarantee of NDIS compliance.",
  };
}

export async function listLearnerCredentials(userId: string) {
  return prisma.academyCredential.findMany({
    where: { userId },
    include: {
      courseVersion: { include: { course: true } },
      expiry: true,
    },
    orderBy: { issuedAt: "desc" },
  });
}

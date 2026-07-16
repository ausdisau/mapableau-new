import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import { recordAcademyAudit } from "@/lib/academy/audit";
import {
  AcademyAuthzError,
  assertAcademyCapability,
  isCurrentOrgMember,
} from "@/lib/academy/authz/capabilities";
import { createEnrolmentForUser } from "@/lib/academy/learning/learning-service";
import { prisma } from "@/lib/prisma";

const assignSchema = z.object({
  organisationId: z.string().min(1),
  courseSlug: z.string().min(1),
  learnerUserId: z.string().min(1),
  dueAt: z.string().datetime().optional(),
});

async function ensureAcademyOrg(organisationId: string) {
  return prisma.academyOrganisation.upsert({
    where: { organisationId },
    create: { organisationId },
    update: {},
  });
}

export async function assignCourseToLearner(
  actor: CurrentUser,
  input: z.infer<typeof assignSchema>,
) {
  await assertAcademyCapability(actor, {
    permission: "academy:provider:admin",
    entitlement: "academy:provider:admin",
  });

  const parsed = assignSchema.parse(input);

  if (actor.primaryRole !== "mapable_admin") {
    const actorMember = await isCurrentOrgMember(parsed.organisationId, actor.id);
    if (!actorMember) {
      throw new AcademyAuthzError("You are not a member of this organisation");
    }
  }

  const learnerMember = await isCurrentOrgMember(
    parsed.organisationId,
    parsed.learnerUserId,
  );
  if (!learnerMember) {
    throw new AcademyAuthzError("Learner must be a current member of the organisation");
  }

  const course = await prisma.course.findUnique({
    where: { slug: parsed.courseSlug },
  });
  if (!course) throw new AcademyAuthzError("Course not found");

  const academyOrg = await ensureAcademyOrg(parsed.organisationId);

  const learnerUser = await prisma.user.findUniqueOrThrow({
    where: { id: parsed.learnerUserId },
    select: { id: true, name: true },
  });
  const enrolment = await createEnrolmentForUser(actor, learnerUser, {
    courseSlug: parsed.courseSlug,
    organisationId: parsed.organisationId,
  });

  const assignment = await prisma.learningAssignment.create({
    data: {
      academyOrganisationId: academyOrg.id,
      courseId: course.id,
      learnerUserId: parsed.learnerUserId,
      createdById: actor.id,
      enrolmentId: enrolment.id,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
      status: "assigned",
    },
    include: {
      course: true,
      learner: { select: { id: true, name: true, email: true } },
      enrolment: true,
    },
  });

  await prisma.academyMembership.upsert({
    where: {
      academyOrganisationId_userId: {
        academyOrganisationId: academyOrg.id,
        userId: parsed.learnerUserId,
      },
    },
    create: {
      academyOrganisationId: academyOrg.id,
      userId: parsed.learnerUserId,
      entitlements: ["academy:learn"],
      status: "active",
    },
    update: {},
  });

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.assignment.created",
    entityType: "LearningAssignment",
    entityId: assignment.id,
    organisationId: parsed.organisationId,
    metadata: {
      learnerUserId: parsed.learnerUserId,
      courseSlug: parsed.courseSlug,
    },
  });

  return assignment;
}

export async function listProviderLearners(actor: CurrentUser, organisationId: string) {
  await assertAcademyCapability(actor, {
    permission: "academy:provider:admin",
    entitlement: "academy:provider:admin",
  });

  if (actor.primaryRole !== "mapable_admin") {
    const ok = await isCurrentOrgMember(organisationId, actor.id);
    if (!ok) throw new AcademyAuthzError("Organisation access denied");
  }

  const members = await prisma.organisationMember.findMany({
    where: { organisationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          academyEnrolments: {
            include: {
              courseVersion: { include: { course: true } },
              credentials: true,
            },
          },
        },
      },
    },
  });

  return members.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    enrolments: m.user.academyEnrolments,
  }));
}

export async function exportProviderReport(actor: CurrentUser, organisationId: string) {
  const learners = await listProviderLearners(actor, organisationId);

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.provider.export",
    entityType: "Organisation",
    entityId: organisationId,
    organisationId,
    metadata: { learnerCount: learners.length },
  });

  return {
    organisationId,
    exportedAt: new Date().toISOString(),
    learners: learners.map((l) => ({
      userId: l.userId,
      name: l.name,
      email: l.email,
      enrolments: l.enrolments.map((e) => ({
        enrolmentId: e.id,
        courseCode: e.courseVersion.course.code,
        courseTitle: e.courseVersion.title,
        courseVersion: e.courseVersion.versionNumber,
        status: e.status,
        completedAt: e.completedAt,
        credentials: e.credentials.map((c) => ({
          publicId: c.publicId,
          status: c.status,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
        })),
      })),
    })),
    disclaimer:
      "MapAble Academy learning records support workforce capability. They do not guarantee NDIS compliance.",
  };
}

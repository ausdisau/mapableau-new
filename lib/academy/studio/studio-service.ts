import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import { recordAcademyAudit } from "@/lib/academy/audit";
import {
  AcademyAuthzError,
  assertAcademyCapability,
} from "@/lib/academy/authz/capabilities";
import { prisma } from "@/lib/prisma";

const publishSchema = z.object({
  courseId: z.string().min(1),
  disabilityLedReviewerId: z.string().min(1).optional(),
});

export async function listStudioCourses(actor: CurrentUser) {
  await assertAcademyCapability(actor, {
    permission: "academy:studio:author",
    anyEntitlement: ["academy:studio:author", "academy:admin"],
  });

  return prisma.course.findMany({
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          contentReviews: true,
          _count: { select: { enrolments: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getStudioCourse(actor: CurrentUser, courseId: string) {
  await assertAcademyCapability(actor, {
    permission: "academy:studio:author",
    anyEntitlement: ["academy:studio:author", "academy:admin"],
  });

  return prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: { lessons: { orderBy: { sortOrder: "asc" } } },
          },
          assessments: { include: { questions: true } },
          contentReviews: true,
        },
      },
      practiceStandardMappings: true,
      competencies: { include: { competency: true } },
    },
  });
}

/**
 * Publish requires disability-led review approval (or mapable_admin with academy:admin).
 * Published versions become immutable after first completion; publishing itself freezes content edits via isImmutable flag after publish.
 */
export async function publishCourseVersion(
  actor: CurrentUser,
  input: z.infer<typeof publishSchema>,
) {
  await assertAcademyCapability(actor, {
    permission: "academy:studio:publish",
    anyEntitlement: ["academy:admin", "academy:review:disability_led"],
  });

  const parsed = publishSchema.parse(input);
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: parsed.courseId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  const version = course.versions[0];
  if (!version) throw new AcademyAuthzError("No course version to publish");

  if (version.isImmutable && version.status === "published") {
    throw new AcademyAuthzError("This course version is already published and immutable");
  }

  if (version.status === "published") {
    return version;
  }

  // Disability-led gate: require an approved ContentReview unless actor is academy:admin
  const isAdmin =
    actor.primaryRole === "mapable_admin" ||
    (await assertAcademyCapability(actor, {
      permission: "academy:admin",
      entitlement: "academy:admin",
    }).then(
      () => true,
      () => false,
    ));

  if (!isAdmin) {
    const approved = await prisma.contentReview.findFirst({
      where: {
        courseVersionId: version.id,
        reviewRole: "disability_led_reviewer",
        decision: "approved",
      },
    });
    if (!approved) {
      throw new AcademyAuthzError(
        "Disability-led review approval is required before publishing",
      );
    }
  } else if (parsed.disabilityLedReviewerId) {
    await prisma.contentReview.create({
      data: {
        courseVersionId: version.id,
        reviewerId: parsed.disabilityLedReviewerId,
        reviewRole: "disability_led_reviewer",
        decision: "approved",
        comments: "Seeded/admin disability-led approval for demonstration course",
      },
    });
  }

  const published = await prisma.courseVersion.update({
    where: { id: version.id },
    data: {
      status: "published",
      publishedAt: new Date(),
      publishedById: actor.id,
      isImmutable: true,
      contentHash: `v${version.versionNumber}:${course.slug}:${Date.now()}`,
    },
  });

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.course.published",
    entityType: "CourseVersion",
    entityId: published.id,
    metadata: { courseId: course.id, versionNumber: published.versionNumber },
  });

  return published;
}

export async function approveDisabilityLedReview(
  actor: CurrentUser,
  courseVersionId: string,
  comments?: string,
) {
  await assertAcademyCapability(actor, {
    permission: "academy:review",
    entitlement: "academy:review:disability_led",
  });

  const review = await prisma.contentReview.create({
    data: {
      courseVersionId,
      reviewerId: actor.id,
      reviewRole: "disability_led_reviewer",
      decision: "approved",
      comments,
    },
  });

  await prisma.courseVersion.update({
    where: { id: courseVersionId },
    data: { status: "in_review" },
  });

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.content_review.approved",
    entityType: "ContentReview",
    entityId: review.id,
    metadata: { courseVersionId, reviewRole: "disability_led_reviewer" },
  });

  return review;
}

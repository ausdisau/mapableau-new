import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import { recordAcademyAudit } from "@/lib/academy/audit";
import {
  AcademyAuthzError,
  assertAcademyCapability,
  assertOwnsEnrolment,
} from "@/lib/academy/authz/capabilities";
import { issueCompletionCredential } from "@/lib/academy/credentials/credential-service";
import { prisma } from "@/lib/prisma";

const enrolSchema = z.object({
  courseSlug: z.string().min(1),
  organisationId: z.string().optional(),
});

const progressSchema = z.object({
  lessonId: z.string().min(1),
  status: z.enum(["not_started", "in_progress", "completed"]),
  percentComplete: z.number().int().min(0).max(100).optional(),
  lastPosition: z.string().optional(),
});

const attemptSchema = z.object({
  assessmentId: z.string().min(1),
  answers: z.array(z.number().int().min(0)),
});

/** Internal enrol — caller must already have authorized the operation. */
export async function createEnrolmentForUser(
  actor: CurrentUser,
  learner: { id: string; name: string },
  input: z.infer<typeof enrolSchema>,
) {
  const parsed = enrolSchema.parse(input);
  const course = await prisma.course.findUnique({
    where: { slug: parsed.courseSlug },
    include: {
      versions: {
        where: { status: "published" },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  const version = course?.versions[0];
  if (!course || !version) {
    throw new AcademyAuthzError("Published course not found", 403);
  }

  await prisma.learnerProfile.upsert({
    where: { userId: learner.id },
    create: { userId: learner.id, displayName: learner.name },
    update: {},
  });

  const enrolment = await prisma.academyEnrolment.upsert({
    where: {
      userId_courseVersionId: {
        userId: learner.id,
        courseVersionId: version.id,
      },
    },
    create: {
      userId: learner.id,
      courseVersionId: version.id,
      organisationId: parsed.organisationId,
      status: "enrolled",
    },
    update: {},
    include: {
      courseVersion: { include: { course: true } },
    },
  });

  await recordAcademyAudit({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "academy.enrolment.created",
    entityType: "AcademyEnrolment",
    entityId: enrolment.id,
    organisationId: parsed.organisationId,
    metadata: {
      courseSlug: course.slug,
      courseVersionId: version.id,
      learnerUserId: learner.id,
    },
  });

  return enrolment;
}

export async function enrolInPublishedCourse(
  user: CurrentUser,
  input: z.infer<typeof enrolSchema>,
) {
  await assertAcademyCapability(user, {
    permission: "academy:learn",
    entitlement: "academy:learn",
  });
  return createEnrolmentForUser(user, { id: user.id, name: user.name }, input);
}

export async function listLearnerEnrolments(userId: string) {
  return prisma.academyEnrolment.findMany({
    where: { userId },
    include: {
      courseVersion: {
        include: {
          course: true,
          modules: {
            orderBy: { sortOrder: "asc" },
            include: { lessons: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      lessonProgress: true,
      credentials: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function getEnrolmentForLearner(
  user: CurrentUser,
  enrolmentId: string,
) {
  await assertOwnsEnrolment(user, enrolmentId);
  return prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
    include: {
      courseVersion: {
        include: {
          course: true,
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: { orderBy: { sortOrder: "asc" } },
            },
          },
          assessments: {
            include: {
              questions: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  prompt: true,
                  optionsJson: true,
                  sortOrder: true,
                  // correctIndex intentionally omitted from learner payload
                },
              },
            },
          },
        },
      },
      lessonProgress: true,
      assessmentAttempts: {
        orderBy: { createdAt: "desc" },
      },
      credentials: true,
    },
  });
}

export async function updateLessonProgress(
  user: CurrentUser,
  enrolmentId: string,
  input: z.infer<typeof progressSchema>,
) {
  await assertOwnsEnrolment(user, enrolmentId);
  const parsed = progressSchema.parse(input);

  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
  });

  if (enrolment.status === "completed") {
    // Progress may still be read, but we allow no regression writes after completion except in_progress→completed already done
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: parsed.lessonId,
      module: { courseVersionId: enrolment.courseVersionId },
    },
  });
  if (!lesson) throw new AcademyAuthzError("Lesson not in this enrolment course version");

  const completedAt =
    parsed.status === "completed" ? new Date() : null;

  const progress = await prisma.lessonProgress.upsert({
    where: {
      enrolmentId_lessonId: {
        enrolmentId,
        lessonId: parsed.lessonId,
      },
    },
    create: {
      enrolmentId,
      lessonId: parsed.lessonId,
      status: parsed.status,
      percentComplete:
        parsed.percentComplete ??
        (parsed.status === "completed" ? 100 : parsed.status === "in_progress" ? 50 : 0),
      lastPosition: parsed.lastPosition,
      completedAt: completedAt ?? undefined,
    },
    update: {
      status: parsed.status,
      percentComplete:
        parsed.percentComplete ??
        (parsed.status === "completed" ? 100 : undefined),
      lastPosition: parsed.lastPosition,
      completedAt: completedAt ?? undefined,
    },
  });

  if (enrolment.status === "enrolled") {
    await prisma.academyEnrolment.update({
      where: { id: enrolmentId },
      data: { status: "in_progress" },
    });
  }

  return progress;
}

export async function submitAssessmentAttempt(
  user: CurrentUser,
  enrolmentId: string,
  input: z.infer<typeof attemptSchema>,
) {
  await assertOwnsEnrolment(user, enrolmentId);
  const parsed = attemptSchema.parse(input);

  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
  });

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: parsed.assessmentId,
      courseVersionId: enrolment.courseVersionId,
    },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!assessment) throw new AcademyAuthzError("Assessment not found for this course version");

  let correct = 0;
  assessment.questions.forEach((q, i) => {
    if (parsed.answers[i] === q.correctIndex) correct += 1;
  });
  const score =
    assessment.questions.length === 0
      ? 100
      : Math.round((correct / assessment.questions.length) * 100);

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      enrolmentId,
      userId: user.id,
      status: "scored",
      answersJson: parsed.answers,
      score,
      submittedAt: new Date(),
      immutable: true,
    },
  });

  await recordAcademyAudit({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "academy.assessment.submitted",
    entityType: "AssessmentAttempt",
    entityId: attempt.id,
    metadata: {
      enrolmentId,
      assessmentId: assessment.id,
      score,
      // Do not log raw answers
    },
  });

  return { attempt, passed: score >= assessment.passingScore, passingScore: assessment.passingScore };
}

/** Learners cannot alter submitted attempts. */
export async function assertAttemptImmutable(attemptId: string): Promise<void> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) throw new AcademyAuthzError("Attempt not found");
  if (attempt.immutable || attempt.status === "submitted" || attempt.status === "scored") {
    throw new AcademyAuthzError("Assessment attempts cannot be altered after submission");
  }
}

export async function completeEnrolment(user: CurrentUser, enrolmentId: string) {
  await assertOwnsEnrolment(user, enrolmentId);

  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
    include: {
      courseVersion: {
        include: {
          course: true,
          modules: { include: { lessons: true } },
          assessments: { include: { attempts: { where: { enrolmentId } } } },
        },
      },
      lessonProgress: true,
      assessmentAttempts: { where: { status: "scored" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (enrolment.status === "completed") {
    const existing = await prisma.academyCredential.findFirst({
      where: { enrolmentId },
    });
    return { enrolment, credential: existing };
  }

  const lessons = enrolment.courseVersion.modules.flatMap((m) => m.lessons);
  const completedLessonIds = new Set(
    enrolment.lessonProgress
      .filter((p) => p.status === "completed")
      .map((p) => p.lessonId),
  );
  const allLessonsDone = lessons.every((l) => completedLessonIds.has(l.id));
  if (!allLessonsDone) {
    throw new AcademyAuthzError("Complete all lessons before finishing the course");
  }

  for (const assessment of enrolment.courseVersion.assessments) {
    const best = enrolment.assessmentAttempts.find(
      (a) => a.assessmentId === assessment.id && (a.score ?? 0) >= assessment.passingScore,
    );
    if (!best) {
      throw new AcademyAuthzError("Pass all assessments before finishing the course");
    }
  }

  // Lock course version immutability once learners complete against it
  if (!enrolment.courseVersion.isImmutable) {
    await prisma.courseVersion.update({
      where: { id: enrolment.courseVersionId },
      data: { isImmutable: true },
    });
  }

  const updated = await prisma.academyEnrolment.update({
    where: { id: enrolmentId },
    data: { status: "completed", completedAt: new Date() },
  });

  const credential = await issueCompletionCredential(user, updated.id);

  await recordAcademyAudit({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "academy.enrolment.completed",
    entityType: "AcademyEnrolment",
    entityId: enrolmentId,
    metadata: { courseVersionId: enrolment.courseVersionId },
  });

  return { enrolment: updated, credential };
}

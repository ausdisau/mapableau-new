import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getEnrolment(userId: string, courseId: string) {
  return prisma.academyEnrolment.findUnique({
    where: { courseId_userId: { courseId, userId } },
    include: {
      course: {
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
          quiz: {
            include: { questions: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      lessonCompletions: true,
      certificate: true,
      quizAttempts: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });
}

export async function listUserEnrolments(userId: string) {
  return prisma.academyEnrolment.findMany({
    where: { userId },
    include: {
      course: true,
      certificate: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function enrolInAcademyCourse(params: {
  courseId: string;
  userId: string;
  actorUserId: string;
  extendedTime?: boolean;
}) {
  const course = await prisma.academyCourse.findFirst({
    where: { id: params.courseId, status: "published" },
  });
  if (!course) throw new Error("COURSE_NOT_FOUND");

  const enrolment = await prisma.academyEnrolment.upsert({
    where: {
      courseId_userId: { courseId: params.courseId, userId: params.userId },
    },
    create: {
      courseId: params.courseId,
      userId: params.userId,
      extendedTime: params.extendedTime ?? false,
      status: "enrolled",
    },
    update: {
      extendedTime: params.extendedTime,
      status: "in_progress",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "academy.enrolment.created",
    entityType: "AcademyEnrolment",
    entityId: enrolment.id,
    metadata: { courseId: params.courseId },
  });

  return enrolment;
}

async function recalcProgress(enrolmentId: string) {
  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
    include: {
      course: { include: { _count: { select: { lessons: true } } } },
      lessonCompletions: true,
    },
  });
  const total = enrolment.course._count.lessons;
  const done = enrolment.lessonCompletions.length;
  const progressPercent =
    total === 0 ? 0 : Math.round((done / total) * 100);
  return prisma.academyEnrolment.update({
    where: { id: enrolmentId },
    data: {
      progressPercent,
      status: progressPercent > 0 ? "in_progress" : enrolment.status,
    },
  });
}

export async function completeLesson(params: {
  lessonId: string;
  userId: string;
  actorUserId: string;
}) {
  const lesson = await prisma.academyLesson.findUniqueOrThrow({
    where: { id: params.lessonId },
    include: { course: true },
  });

  const enrolment = await prisma.academyEnrolment.findUnique({
    where: {
      courseId_userId: { courseId: lesson.courseId, userId: params.userId },
    },
  });
  if (!enrolment) throw new Error("NOT_ENROLLED");

  const priorLessons = await prisma.academyLesson.findMany({
    where: { courseId: lesson.courseId, sortOrder: { lt: lesson.sortOrder } },
    select: { id: true },
  });
  if (priorLessons.length > 0) {
    const completed = await prisma.academyLessonCompletion.count({
      where: {
        enrolmentId: enrolment.id,
        lessonId: { in: priorLessons.map((l) => l.id) },
      },
    });
    if (completed < priorLessons.length) {
      throw new Error("LESSON_ORDER_REQUIRED");
    }
  }

  await prisma.academyLessonCompletion.upsert({
    where: {
      enrolmentId_lessonId: {
        enrolmentId: enrolment.id,
        lessonId: params.lessonId,
      },
    },
    create: {
      enrolmentId: enrolment.id,
      lessonId: params.lessonId,
      userId: params.userId,
    },
    update: {},
  });

  const updated = await recalcProgress(enrolment.id);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "academy.lesson.completed",
    entityType: "AcademyLesson",
    entityId: params.lessonId,
    metadata: { enrolmentId: enrolment.id },
  });

  return updated;
}

export function allLessonsComplete(
  lessonCount: number,
  completionCount: number,
): boolean {
  return lessonCount > 0 && completionCount >= lessonCount;
}

export async function canAccessQuiz(enrolmentId: string): Promise<boolean> {
  const enrolment = await prisma.academyEnrolment.findUniqueOrThrow({
    where: { id: enrolmentId },
    include: {
      course: { include: { _count: { select: { lessons: true } } } },
      lessonCompletions: true,
    },
  });
  return allLessonsComplete(
    enrolment.course._count.lessons,
    enrolment.lessonCompletions.length,
  );
}

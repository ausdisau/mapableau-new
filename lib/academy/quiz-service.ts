import { randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { QuizAnswerSubmission } from "@/types/academy";

import { canAccessQuiz } from "./enrolment-service";

export async function submitQuiz(params: {
  quizId: string;
  userId: string;
  actorUserId: string;
  answers: QuizAnswerSubmission[];
}) {
  const quiz = await prisma.academyQuiz.findUniqueOrThrow({
    where: { id: params.quizId },
    include: { questions: true, course: true },
  });

  const enrolment = await prisma.academyEnrolment.findUnique({
    where: {
      courseId_userId: { courseId: quiz.courseId, userId: params.userId },
    },
  });
  if (!enrolment) throw new Error("NOT_ENROLLED");

  const allowed = await canAccessQuiz(enrolment.id);
  if (!allowed) throw new Error("LESSONS_INCOMPLETE");

  let correct = 0;
  for (const q of quiz.questions) {
    const answer = params.answers.find((a) => a.questionId === q.id);
    if (answer && answer.selectedIndex === q.correctIndex) correct += 1;
  }
  const total = quiz.questions.length;
  const scorePercent =
    total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = scorePercent >= quiz.passMarkPercent;

  const attempt = await prisma.academyQuizAttempt.create({
    data: {
      enrolmentId: enrolment.id,
      quizId: quiz.id,
      userId: params.userId,
      scorePercent,
      passed,
      answersJson: params.answers,
    },
  });

  if (passed) {
    await issueCertificate({
      enrolmentId: enrolment.id,
      userId: params.userId,
      courseId: quiz.courseId,
      scorePercent,
      actorUserId: params.actorUserId,
    });
  }

  return { attempt, scorePercent, passed, passMark: quiz.passMarkPercent };
}

async function issueCertificate(params: {
  enrolmentId: string;
  userId: string;
  courseId: string;
  scorePercent: number;
  actorUserId: string;
}) {
  const existing = await prisma.academyCertificate.findUnique({
    where: { enrolmentId: params.enrolmentId },
  });
  if (existing) return existing;

  const certNumber = `MA-${randomBytes(4).toString("hex").toUpperCase()}`;

  const certificate = await prisma.academyCertificate.create({
    data: {
      enrolmentId: params.enrolmentId,
      userId: params.userId,
      courseId: params.courseId,
      certificateNumber: certNumber,
    },
  });

  await prisma.academyEnrolment.update({
    where: { id: params.enrolmentId },
    data: { status: "completed", completedAt: new Date(), progressPercent: 100 },
  });

  await prisma.academyTrainingRecord.create({
    data: {
      userId: params.userId,
      courseId: params.courseId,
      scorePercent: params.scorePercent,
      metadata: { certificateNumber: certNumber },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "academy.certificate.issued",
    entityType: "AcademyCertificate",
    entityId: certificate.id,
    metadata: { courseId: params.courseId, scorePercent: params.scorePercent },
  });

  return certificate;
}

export async function listUserCertificates(userId: string) {
  return prisma.academyCertificate.findMany({
    where: { userId },
    include: { enrolment: { include: { course: true } } },
    orderBy: { issuedAt: "desc" },
  });
}

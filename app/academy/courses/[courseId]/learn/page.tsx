import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseLearnClient } from "@/components/academy/CourseLearnClient";
import { requirePermission } from "@/lib/auth/guards";
import { getPublishedCourse } from "@/lib/academy/course-service";
import { getEnrolment, allLessonsComplete } from "@/lib/academy/enrolment-service";

type Props = { params: Promise<{ courseId: string }> };

export default async function AcademyLearnPage({ params }: Props) {
  const user = await requirePermission("academy:enrol");
  const { courseId } = await params;
  const course = await getPublishedCourse(courseId);
  if (!course) notFound();

  const enrolment = await getEnrolment(user.id, courseId);
  if (!enrolment) {
    redirect(`/academy/courses/${courseId}`);
  }

  const completedLessonIds = enrolment.lessonCompletions.map((c) => c.lessonId);
  const lessonsDone = allLessonsComplete(
    course.lessons.length,
    completedLessonIds.length,
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href={`/academy/courses/${courseId}`}
        className="text-sm text-primary underline"
      >
        ← Course overview
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-muted-foreground" role="status">
          Progress: {enrolment.progressPercent}%
          {enrolment.extendedTime ? " · Extended time enabled" : ""}
        </p>
      </header>
      <CourseLearnClient
        courseId={course.id}
        courseTitle={course.title}
        lessons={course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          contentMarkdown: l.contentMarkdown,
          videoUrl: l.videoUrl,
          captionsRequired: l.captionsRequired,
          sortOrder: l.sortOrder,
        }))}
        completedLessonIds={completedLessonIds}
        quiz={
          course.quiz
            ? {
                id: course.quiz.id,
                title: course.quiz.title,
                passMarkPercent: course.quiz.passMarkPercent,
                questions: course.quiz.questions.map((q) => ({
                  id: q.id,
                  questionText: q.questionText,
                  options: q.options,
                })),
              }
            : null
        }
        certificate={
          enrolment.certificate
            ? {
                certificateNumber: enrolment.certificate.certificateNumber,
                issuedAt: enrolment.certificate.issuedAt.toISOString(),
              }
            : null
        }
        allLessonsDone={lessonsDone}
      />
    </main>
  );
}

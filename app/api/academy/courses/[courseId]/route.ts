import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getPublishedCourse } from "@/lib/academy/course-service";
import { getEnrolment } from "@/lib/academy/enrolment-service";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("academy:read");
  if (user instanceof Response) return user;
  const { courseId } = await params;
  const course = await getPublishedCourse(courseId);
  if (!course) return jsonError("Not found", 404);

  const enrolment = await getEnrolment(user.id, courseId);

  const quizForLearner = course.quiz
    ? {
        id: course.quiz.id,
        title: course.quiz.title,
        passMarkPercent: course.quiz.passMarkPercent,
        questions: course.quiz.questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          sortOrder: q.sortOrder,
        })),
      }
    : null;

  return jsonOk({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      estimatedMinutes: course.estimatedMinutes,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        contentMarkdown: l.contentMarkdown,
        videoUrl: l.videoUrl,
        captionsRequired: l.captionsRequired,
        sortOrder: l.sortOrder,
      })),
      quiz: quizForLearner,
    },
    enrolment: enrolment
      ? {
          id: enrolment.id,
          status: enrolment.status,
          progressPercent: enrolment.progressPercent,
          extendedTime: enrolment.extendedTime,
          completedLessonIds: enrolment.lessonCompletions.map((c) => c.lessonId),
          certificate: enrolment.certificate,
          lastAttempt: enrolment.quizAttempts[0] ?? null,
        }
      : null,
  });
}

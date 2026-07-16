import Link from "next/link";

import { QuizForm } from "@/components/academy/LessonPlayerActions";
import { requirePermission } from "@/lib/auth/guards";
import { getEnrolmentForLearner } from "@/lib/academy/learning/learning-service";

type Props = { params: Promise<{ enrolmentId: string }> };

export default async function AcademyEnrolmentPage({ params }: Props) {
  const user = await requirePermission("academy:learn");
  const { enrolmentId } = await params;
  const enrolment = await getEnrolmentForLearner(user, enrolmentId);
  const lessons = enrolment.courseVersion.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const completed = new Set(
    enrolment.lessonProgress.filter((p) => p.status === "completed").map((p) => p.lessonId),
  );
  const assessment = enrolment.courseVersion.assessments[0];

  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">
        {enrolment.courseVersion.title}
      </h1>
      <p className="text-sm text-slate-600">
        Course version {enrolment.courseVersion.versionNumber} · status {enrolment.status}
      </p>
      <section aria-labelledby="lessons-heading">
        <h2 id="lessons-heading" className="text-xl font-semibold">
          Lessons
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/academy/learn/${enrolmentId}/lesson/${lesson.id}`}
                className="text-teal-800 underline"
              >
                {lesson.title}
              </Link>
              {completed.has(lesson.id) ? (
                <span className="ml-2 text-sm text-emerald-800">Completed</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      {assessment ? (
        <QuizForm
          enrolmentId={enrolmentId}
          assessmentId={assessment.id}
          passingScore={assessment.passingScore}
          questions={assessment.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            optionsJson: q.optionsJson,
          }))}
        />
      ) : null}
    </article>
  );
}

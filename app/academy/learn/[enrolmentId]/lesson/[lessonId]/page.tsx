import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonPlayerActions } from "@/components/academy/LessonPlayerActions";
import { requirePermission } from "@/lib/auth/guards";
import { getEnrolmentForLearner } from "@/lib/academy/learning/learning-service";
import { updateLessonProgress } from "@/lib/academy/learning/learning-service";

type Props = {
  params: Promise<{ enrolmentId: string; lessonId: string }>;
  searchParams: Promise<{ easyRead?: string }>;
};

export default async function AcademyLessonPage({ params, searchParams }: Props) {
  const user = await requirePermission("academy:learn");
  const { enrolmentId, lessonId } = await params;
  const { easyRead } = await searchParams;
  const enrolment = await getEnrolmentForLearner(user, enrolmentId);

  const lessons = enrolment.courseVersion.modules.flatMap((m) => m.lessons);
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = lessons[index]!;
  const next = lessons[index + 1];

  // Mark in progress (save/resume) — server-side, no client trap
  await updateLessonProgress(user, enrolmentId, {
    lessonId,
    status: "in_progress",
    percentComplete: 25,
  });

  const body =
    easyRead === "1" && lesson.easyReadMarkdown
      ? lesson.easyReadMarkdown
      : lesson.bodyMarkdown;

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href={`/academy/learn/${enrolmentId}`} className="text-teal-800 underline">
          Course
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{lesson.title}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-teal-950">{lesson.title}</h1>
        {lesson.easyReadMarkdown ? (
          <p className="text-sm">
            {easyRead === "1" ? (
              <Link
                href={`/academy/learn/${enrolmentId}/lesson/${lessonId}`}
                className="text-teal-800 underline"
              >
                Standard version
              </Link>
            ) : (
              <Link
                href={`/academy/learn/${enrolmentId}/lesson/${lessonId}?easyRead=1`}
                className="text-teal-800 underline"
              >
                Easy Read version
              </Link>
            )}
          </p>
        ) : null}
      </header>
      <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-800">
        {body}
      </div>
      {lesson.transcript ? (
        <section aria-labelledby="transcript-heading">
          <h2 id="transcript-heading" className="text-lg font-semibold">
            Transcript
          </h2>
          <p className="text-sm text-slate-700">{lesson.transcript}</p>
        </section>
      ) : null}
      {lesson.audioDescription ? (
        <section aria-labelledby="ad-heading">
          <h2 id="ad-heading" className="text-lg font-semibold">
            Audio description
          </h2>
          <p className="text-sm text-slate-700">{lesson.audioDescription}</p>
        </section>
      ) : null}
      {lesson.captionsVtt ? (
        <section aria-labelledby="captions-heading">
          <h2 id="captions-heading" className="text-lg font-semibold">
            Captions (VTT)
          </h2>
          <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs">{lesson.captionsVtt}</pre>
        </section>
      ) : null}
      <LessonPlayerActions
        enrolmentId={enrolmentId}
        lessonId={lessonId}
        nextHref={
          next
            ? `/academy/learn/${enrolmentId}/lesson/${next.id}`
            : `/academy/learn/${enrolmentId}`
        }
      />
    </article>
  );
}

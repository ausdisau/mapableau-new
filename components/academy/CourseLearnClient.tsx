"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CertificateBadge } from "@/components/academy/CertificateBadge";
import { LessonReader } from "@/components/academy/LessonReader";
import { QuizForm } from "@/components/academy/QuizForm";

type Lesson = {
  id: string;
  title: string;
  contentMarkdown: string;
  videoUrl: string | null;
  captionsRequired: boolean;
  sortOrder: number;
};

type Props = {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
  completedLessonIds: string[];
  quiz: {
    id: string;
    title: string;
    passMarkPercent: number;
    questions: { id: string; questionText: string; options: string[] }[];
  } | null;
  certificate: {
    certificateNumber: string;
    issuedAt: string;
  } | null;
  allLessonsDone: boolean;
};

export function CourseLearnClient({
  courseId,
  courseTitle,
  lessons,
  completedLessonIds: initialCompleted,
  quiz,
  certificate: initialCert,
  allLessonsDone: initialAllDone,
}: Props) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState(initialCompleted);
  const [completing, setCompleting] = useState<string | null>(null);
  const [certificate, setCertificate] = useState(initialCert);
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number;
    passed: boolean;
  } | null>(null);

  const allLessonsDone =
    lessons.length > 0 && lessons.every((l) => completedIds.includes(l.id));

  async function completeLesson(lessonId: string) {
    setCompleting(lessonId);
    const res = await fetch(`/api/academy/lessons/${lessonId}/complete`, {
      method: "POST",
    });
    setCompleting(null);
    if (res.ok) {
      setCompletedIds((prev) =>
        prev.includes(lessonId) ? prev : [...prev, lessonId],
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {certificate ? (
        <CertificateBadge
          certificateNumber={certificate.certificateNumber}
          courseTitle={courseTitle}
          issuedAt={certificate.issuedAt}
        />
      ) : null}

      <section aria-label="Lessons" className="space-y-6">
        {lessons.map((lesson) => (
          <LessonReader
            key={lesson.id}
            title={lesson.title}
            contentMarkdown={lesson.contentMarkdown}
            videoUrl={lesson.videoUrl}
            captionsRequired={lesson.captionsRequired}
            completed={completedIds.includes(lesson.id)}
            completing={completing === lesson.id}
            onComplete={() => completeLesson(lesson.id)}
          />
        ))}
      </section>

      {quiz && allLessonsDone && !certificate ? (
        <section aria-label="Quiz">
          {quizResult ? (
            <div
              role="status"
              className={`rounded-xl border p-4 ${
                quizResult.passed
                  ? "border-primary/40 bg-primary/5"
                  : "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20"
              }`}
            >
              <p className="font-medium">
                Score: {quizResult.scorePercent}% —{" "}
                {quizResult.passed ? "Passed" : "Not passed yet"}
              </p>
              {!quizResult.passed ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Review the lessons and try again.
                </p>
              ) : null}
            </div>
          ) : null}
          <QuizForm
            quizId={quiz.id}
            title={quiz.title}
            passMarkPercent={quiz.passMarkPercent}
            questions={quiz.questions}
            disabled={Boolean(certificate) || quizResult?.passed}
            onSubmitted={(r) => {
              setQuizResult({ scorePercent: r.scorePercent, passed: r.passed });
              if (r.passed) router.refresh();
            }}
          />
        </section>
      ) : null}

      {quiz && !allLessonsDone && !initialAllDone ? (
        <p className="text-sm text-muted-foreground" role="status">
          Complete all lessons to unlock the quiz.
        </p>
      ) : null}
    </div>
  );
}

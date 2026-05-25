import Link from "next/link";
import { notFound } from "next/navigation";

import { EnrolButton } from "@/components/academy/EnrolButton";
import { requirePermission } from "@/lib/auth/guards";
import { getPublishedCourse } from "@/lib/academy/course-service";
import { getEnrolment } from "@/lib/academy/enrolment-service";

type Props = { params: Promise<{ courseId: string }> };

export default async function AcademyCoursePage({ params }: Props) {
  const user = await requirePermission("academy:read");
  const { courseId } = await params;
  const course = await getPublishedCourse(courseId);
  if (!course) notFound();

  const enrolment = await getEnrolment(user.id, courseId);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/academy" className="text-sm text-primary underline">
        ← Academy catalog
      </Link>
      <header className="space-y-2">
        <p className="text-xs uppercase text-muted-foreground">
          {course.category.replace(/_/g, " ")}
        </p>
        <h1 className="font-heading text-3xl font-bold">{course.title}</h1>
        {course.summary ? (
          <p className="text-muted-foreground">{course.summary}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {course.lessons.length} lessons · ~{course.estimatedMinutes} minutes
          {course.quiz ? ` · Quiz pass mark ${course.quiz.passMarkPercent}%` : ""}
        </p>
      </header>
      {course.description ? (
        <p className="text-sm whitespace-pre-wrap">{course.description}</p>
      ) : null}
      <EnrolButton courseId={course.id} enrolled={Boolean(enrolment)} />
      {enrolment?.certificate ? (
        <p className="text-sm text-primary" role="status">
          You have completed this course.
        </p>
      ) : null}
    </main>
  );
}

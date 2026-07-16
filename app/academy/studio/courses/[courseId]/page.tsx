"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudioCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<{
    id: string;
    title: string;
    versions: Array<{ id: string; versionNumber: number; status: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/academy/studio/courses?courseId=${params.courseId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Unable to load course");
        return;
      }
      setCourse((data as { course: typeof course }).course);
    })();
  }, [params.courseId]);

  async function publish() {
    if (!course) return;
    setError(null);
    const res = await fetch("/api/academy/studio/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: course.id }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError((data as { error?: string } | null)?.error ?? "Publish failed");
      return;
    }
    setMessage("Course version published. Completions reference this immutable version.");
    router.refresh();
  }

  if (error && !course) {
    return (
      <p role="alert" className="text-red-700">
        {error}
      </p>
    );
  }

  if (!course) return <p>Loading…</p>;

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">{course.title}</h1>
      <ul className="text-sm text-slate-700">
        {course.versions.map((v) => (
          <li key={v.id}>
            Version {v.versionNumber}: {v.status}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={publish}
        className="rounded bg-teal-800 px-4 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Publish latest version
      </button>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}

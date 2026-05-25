import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Academy admin | MapAble" };

export default async function AdminAcademyPage() {
  await requireAdmin();
  const courses = await prisma.academyCourse.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { lessons: true, enrolments: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">MapAble Academy admin</h1>
          <p className="text-muted-foreground">
            Publish courses and monitor enrolments. Use API POST /api/admin/academy/courses to create drafts.
          </p>
        </div>
        <Link
          href="/admin/provider-academy"
          className="text-sm text-primary underline"
        >
          Legacy provider academy
        </Link>
      </header>
      <ul className="space-y-2">
        {courses.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-border p-4 flex justify-between gap-2"
          >
            <div>
              <span className="font-medium">{c.title}</span>
              <p className="text-sm text-muted-foreground">
                {c.slug} · {c.status} · {c._count.lessons} lessons ·{" "}
                {c._count.enrolments} enrolments
              </p>
            </div>
            <Link
              href={`/academy/courses/${c.id}`}
              className="text-sm text-primary underline"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
      {courses.length === 0 ? (
        <p role="status">
          No courses yet. Run{" "}
          <code className="text-sm">pnpm tsx lib/academy/seed-academy.ts</code> or
          create via admin API.
        </p>
      ) : null}
    </div>
  );
}

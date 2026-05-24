import { prisma } from "@/lib/prisma";

export async function listPublishedCourses() {
  return prisma.academyCourse.findMany({
    where: { status: "published" },
    include: {
      _count: { select: { lessons: true } },
    },
    orderBy: { title: "asc" },
  });
}

export async function getPublishedCourse(courseId: string) {
  return prisma.academyCourse.findFirst({
    where: { id: courseId, status: "published" },
    include: {
      lessons: { orderBy: { sortOrder: "asc" } },
      quiz: {
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
        },
      },
      _count: { select: { lessons: true } },
    },
  });
}

export async function getPublishedCourseBySlug(slug: string) {
  return prisma.academyCourse.findFirst({
    where: { slug, status: "published" },
    include: {
      lessons: { orderBy: { sortOrder: "asc" } },
      quiz: {
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}

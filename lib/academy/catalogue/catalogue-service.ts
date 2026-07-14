import { prisma } from "@/lib/prisma";

export async function listPublishedCatalogue() {
  return prisma.course.findMany({
    where: {
      versions: { some: { status: "published" } },
    },
    include: {
      versions: {
        where: { status: "published" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: {
          id: true,
          versionNumber: true,
          title: true,
          description: true,
          publishedAt: true,
          status: true,
        },
      },
      practiceStandardMappings: true,
    },
    orderBy: { title: "asc" },
  });
}

export async function getPublishedCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      versions: {
        where: { status: "published" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  sortOrder: true,
                  estimatedMinutes: true,
                  easyReadMarkdown: true,
                },
              },
            },
          },
          assessments: {
            select: { id: true, title: true, passingScore: true, timeLimitMinutes: true },
          },
        },
      },
      practiceStandardMappings: true,
      competencies: {
        include: { competency: true },
      },
    },
  });

  if (!course || course.versions.length === 0) return null;
  return course;
}

export async function getPublishedPathwayBySlug(slug: string) {
  return prisma.learningPath.findFirst({
    where: { slug, status: "published" },
    include: {
      courses: {
        orderBy: { sortOrder: "asc" },
        include: {
          course: {
            include: {
              versions: {
                where: { status: "published" },
                orderBy: { versionNumber: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
}

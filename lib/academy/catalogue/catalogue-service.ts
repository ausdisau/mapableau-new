import type { AcademyCourseLevel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CatalogueFilters = {
  q?: string;
  schoolCode?: string;
  level?: AcademyCourseLevel;
  deliveryFormat?: string;
  pathwayCode?: string;
  clinicalReviewRequired?: boolean;
  practicalAssessmentRequired?: boolean;
  minDuration?: number;
  maxDuration?: number;
  audience?: string;
  includeNonPublished?: boolean;
};

const publicSelect = {
  id: true,
  code: true,
  slug: true,
  title: true,
  summary: true,
  primaryAudience: true,
  level: true,
  deliveryFormat: true,
  durationMinutes: true,
  assessmentType: true,
  credentialType: true,
  suggestedReviewCycle: true,
  practicalAssessmentRequired: true,
  clinicalReviewRequired: true,
  releaseWave: true,
  publicationStatus: true,
  indicativeLearningOutcome: true,
  pathwayBadge: true,
  school: {
    select: {
      code: true,
      name: true,
      pathwayBadge: true,
    },
  },
  frameworkTags: {
    include: { frameworkTag: { select: { code: true, label: true } } },
  },
} satisfies Prisma.CourseSelect;

/** Public catalogue — PUBLISHED only; no governance notes. */
export async function listPublicCatalogue(filters: CatalogueFilters = {}) {
  const where: Prisma.CourseWhereInput = {
    publicationStatus: "PUBLISHED",
  };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { code: { contains: filters.q, mode: "insensitive" } },
      { summary: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.schoolCode) where.school = { code: filters.schoolCode };
  if (filters.level) where.level = filters.level;
  if (filters.deliveryFormat) {
    where.deliveryFormat = { contains: filters.deliveryFormat, mode: "insensitive" };
  }
  if (filters.audience) {
    where.primaryAudience = { contains: filters.audience, mode: "insensitive" };
  }
  if (filters.clinicalReviewRequired != null) {
    where.clinicalReviewRequired = filters.clinicalReviewRequired;
  }
  if (filters.practicalAssessmentRequired != null) {
    where.practicalAssessmentRequired = filters.practicalAssessmentRequired;
  }
  if (filters.minDuration != null || filters.maxDuration != null) {
    where.durationMinutes = {
      ...(filters.minDuration != null ? { gte: filters.minDuration } : {}),
      ...(filters.maxDuration != null ? { lte: filters.maxDuration } : {}),
    };
  }
  if (filters.pathwayCode) {
    where.pathLinks = { some: { learningPath: { code: filters.pathwayCode } } };
  }

  return prisma.course.findMany({
    where,
    select: publicSelect,
    orderBy: [{ school: { displayOrder: "asc" } }, { code: "asc" }],
  });
}

export async function getPublicCourseByCode(courseCode: string) {
  return prisma.course.findFirst({
    where: { code: courseCode, publicationStatus: "PUBLISHED" },
    select: {
      ...publicSelect,
      sources: {
        select: { sourceUrl: true, sourceTitle: true, sourceType: true },
      },
    },
  });
}

export async function listPublicPathways() {
  return prisma.learningPath.findMany({
    where: {
      OR: [{ status: "published" }, { school: { status: "active" } }],
    },
    include: {
      school: true,
      courses: {
        where: { course: { publicationStatus: "PUBLISHED" } },
        orderBy: { sortOrder: "asc" },
        include: {
          course: {
            select: {
              code: true,
              title: true,
              durationMinutes: true,
              level: true,
              practicalAssessmentRequired: true,
            },
          },
        },
      },
    },
    orderBy: { school: { displayOrder: "asc" } },
  });
}

export async function getPublicPathwayByCode(code: string) {
  return prisma.learningPath.findFirst({
    where: { code },
    include: {
      school: true,
      courses: {
        where: { course: { publicationStatus: "PUBLISHED" } },
        orderBy: { sortOrder: "asc" },
        include: {
          course: { select: publicSelect },
        },
      },
    },
  });
}

export async function listAdminCatalogue(filters: CatalogueFilters = {}) {
  const where: Prisma.CourseWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { code: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.schoolCode) where.school = { code: filters.schoolCode };
  if (filters.level) where.level = filters.level;
  if (filters.clinicalReviewRequired != null) {
    where.clinicalReviewRequired = filters.clinicalReviewRequired;
  }
  if (filters.practicalAssessmentRequired != null) {
    where.practicalAssessmentRequired = filters.practicalAssessmentRequired;
  }

  return prisma.course.findMany({
    where,
    include: {
      school: true,
      sources: true,
      frameworkTags: { include: { frameworkTag: true } },
      versions: {
        select: { id: true, versionNumber: true, status: true, isImmutable: true },
        orderBy: { versionNumber: "desc" },
        take: 3,
      },
    },
    orderBy: { code: "asc" },
  });
}

/** Content-bearing published courses (MVP player). */
export async function listPublishedCatalogue() {
  return prisma.course.findMany({
    where: { versions: { some: { status: "published" } } },
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
      competencies: { include: { competency: true } },
      school: true,
    },
  });

  if (!course || course.versions.length === 0) return null;
  return course;
}

export async function getPublishedPathwayBySlug(slug: string) {
  return getPublicPathwayByCode(slug);
}

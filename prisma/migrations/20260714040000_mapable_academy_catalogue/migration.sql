-- CreateEnum
CREATE TYPE "AcademyPublicationStatus" AS ENUM ('PLANNED', 'IN_DESIGN', 'IN_REVIEW', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AcademyCourseLevel" AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AcademyReleaseWave" AS ENUM ('WAVE_1_LAUNCH', 'WAVE_2_EXPANSION', 'WAVE_3_SPECIALIST');

-- CreateEnum
CREATE TYPE "AcademySchoolStatus" AS ENUM ('active', 'retired');

-- CreateEnum
CREATE TYPE "CurriculumImportResult" AS ENUM ('dry_run', 'applied', 'failed', 'validate_only');

-- CreateEnum
CREATE TYPE "CurriculumImportIssueSeverity" AS ENUM ('error', 'warning', 'info');

-- AlterTable
ALTER TABLE "academy_courses" ADD COLUMN     "assessmentType" TEXT,
ADD COLUMN     "clinicalReviewRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "credentialType" TEXT,
ADD COLUMN     "deliveryFormat" TEXT,
ADD COLUMN     "disabilityLedReviewRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "governanceNote" TEXT,
ADD COLUMN     "indicativeLearningOutcome" TEXT,
ADD COLUMN     "level" "AcademyCourseLevel",
ADD COLUMN     "pathwayBadge" TEXT,
ADD COLUMN     "practicalAssessmentRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primaryAudience" TEXT,
ADD COLUMN     "publicationStatus" "AcademyPublicationStatus" NOT NULL DEFAULT 'PLANNED',
ADD COLUMN     "releaseWave" "AcademyReleaseWave",
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "suggestedReviewCycle" TEXT;

-- AlterTable
ALTER TABLE "academy_learning_path_courses" ADD COLUMN     "prerequisiteCourseId" TEXT,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "academy_learning_paths" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "badgeName" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "schoolId" TEXT;

-- CreateTable
CREATE TABLE "academy_schools" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "primaryAudience" TEXT,
    "pathwayBadge" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "AcademySchoolStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_course_sources" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "sourceType" TEXT,
    "retrievedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_course_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_framework_tags" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_framework_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_course_framework_tags" (
    "courseId" TEXT NOT NULL,
    "frameworkTagId" TEXT NOT NULL,

    CONSTRAINT "academy_course_framework_tags_pkey" PRIMARY KEY ("courseId","frameworkTagId")
);

-- CreateTable
CREATE TABLE "academy_curriculum_import_runs" (
    "id" TEXT NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "initiatedBy" TEXT,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "result" "CurriculumImportResult" NOT NULL DEFAULT 'dry_run',
    "reportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_curriculum_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_curriculum_import_issues" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT NOT NULL,
    "sheet" TEXT,
    "rowNumber" INTEGER,
    "courseCode" TEXT,
    "severity" "CurriculumImportIssueSeverity" NOT NULL DEFAULT 'error',
    "field" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_curriculum_import_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_schools_code_key" ON "academy_schools"("code");

-- CreateIndex
CREATE INDEX "academy_course_sources_courseId_idx" ON "academy_course_sources"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_framework_tags_code_key" ON "academy_framework_tags"("code");

-- CreateIndex
CREATE INDEX "academy_curriculum_import_runs_createdAt_idx" ON "academy_curriculum_import_runs"("createdAt");

-- CreateIndex
CREATE INDEX "academy_curriculum_import_issues_importRunId_idx" ON "academy_curriculum_import_issues"("importRunId");

-- CreateIndex
CREATE INDEX "academy_courses_schoolId_idx" ON "academy_courses"("schoolId");

-- CreateIndex
CREATE INDEX "academy_courses_publicationStatus_idx" ON "academy_courses"("publicationStatus");

-- CreateIndex
CREATE INDEX "academy_courses_releaseWave_idx" ON "academy_courses"("releaseWave");

-- CreateIndex
CREATE INDEX "academy_learning_path_courses_prerequisiteCourseId_idx" ON "academy_learning_path_courses"("prerequisiteCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_learning_paths_code_key" ON "academy_learning_paths"("code");

-- CreateIndex
CREATE INDEX "academy_learning_paths_schoolId_idx" ON "academy_learning_paths"("schoolId");

-- AddForeignKey
ALTER TABLE "academy_courses" ADD CONSTRAINT "academy_courses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "academy_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_paths" ADD CONSTRAINT "academy_learning_paths_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "academy_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_path_courses" ADD CONSTRAINT "academy_learning_path_courses_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "academy_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_sources" ADD CONSTRAINT "academy_course_sources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_framework_tags" ADD CONSTRAINT "academy_course_framework_tags_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_framework_tags" ADD CONSTRAINT "academy_course_framework_tags_frameworkTagId_fkey" FOREIGN KEY ("frameworkTagId") REFERENCES "academy_framework_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_curriculum_import_issues" ADD CONSTRAINT "academy_curriculum_import_issues_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "academy_curriculum_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS for new catalogue tables (ENABLE only; owners bypass for Prisma)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'academy_schools',
    'academy_course_sources',
    'academy_framework_tags',
    'academy_course_framework_tags',
    'academy_curriculum_import_runs',
    'academy_curriculum_import_issues'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

CREATE POLICY academy_schools_public_read ON academy_schools
  FOR SELECT USING (status = 'active');

CREATE POLICY academy_framework_tags_public_read ON academy_framework_tags
  FOR SELECT USING (true);

CREATE POLICY academy_course_framework_tags_public_read ON academy_course_framework_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_course_framework_tags."courseId"
        AND c."publicationStatus" = 'PUBLISHED'
    )
  );

CREATE POLICY academy_course_sources_admin_or_published ON academy_course_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_course_sources."courseId"
        AND c."publicationStatus" = 'PUBLISHED'
    )
  );

-- Published catalogue rows readable; planned/governance protected by column projection in app
CREATE POLICY academy_courses_published_read ON academy_courses
  FOR SELECT USING ("publicationStatus" = 'PUBLISHED');

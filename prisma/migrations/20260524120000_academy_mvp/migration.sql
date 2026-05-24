-- MapAble Academy MVP
CREATE TYPE "AcademyCourseStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AcademyEnrolmentStatus" AS ENUM ('enrolled', 'in_progress', 'completed', 'withdrawn');

CREATE TABLE "AcademyCourse" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ndis_compliance',
    "status" "AcademyCourseStatus" NOT NULL DEFAULT 'draft',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "videoUrl" TEXT,
    "captionsRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyQuiz" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passMarkPercent" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyQuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AcademyQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyEnrolment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AcademyEnrolmentStatus" NOT NULL DEFAULT 'enrolled',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "extendedTime" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyLessonCompletion" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyLessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyQuizAttempt" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scorePercent" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answersJson" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyCertificate" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "AcademyCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyTrainingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scorePercent" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "AcademyTrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerTrainingRequirement" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "requiredRole" "MapAbleUserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerTrainingRequirement_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "AcademyCourse_slug_key" ON "AcademyCourse"("slug");

-- CreateIndex
CREATE INDEX "AcademyCourse_status_category_idx" ON "AcademyCourse"("status", "category");

-- CreateIndex
CREATE INDEX "AcademyLesson_courseId_sortOrder_idx" ON "AcademyLesson"("courseId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyQuiz_courseId_key" ON "AcademyQuiz"("courseId");

-- CreateIndex
CREATE INDEX "AcademyQuizQuestion_quizId_sortOrder_idx" ON "AcademyQuizQuestion"("quizId", "sortOrder");

-- CreateIndex
CREATE INDEX "AcademyEnrolment_userId_status_idx" ON "AcademyEnrolment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyEnrolment_courseId_userId_key" ON "AcademyEnrolment"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyLessonCompletion_enrolmentId_lessonId_key" ON "AcademyLessonCompletion"("enrolmentId", "lessonId");

-- CreateIndex
CREATE INDEX "AcademyQuizAttempt_enrolmentId_idx" ON "AcademyQuizAttempt"("enrolmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCertificate_enrolmentId_key" ON "AcademyCertificate"("enrolmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCertificate_certificateNumber_key" ON "AcademyCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "AcademyTrainingRecord_userId_courseId_idx" ON "AcademyTrainingRecord"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerTrainingRequirement_organisationId_courseId_requiredR_key" ON "WorkerTrainingRequirement"("organisationId", "courseId", "requiredRole");

ALTER TABLE "AcademyLesson" ADD CONSTRAINT "AcademyLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuiz" ADD CONSTRAINT "AcademyQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuizQuestion" ADD CONSTRAINT "AcademyQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "AcademyQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyEnrolment" ADD CONSTRAINT "AcademyEnrolment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyEnrolment" ADD CONSTRAINT "AcademyEnrolment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyLessonCompletion" ADD CONSTRAINT "AcademyLessonCompletion_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "AcademyEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyLessonCompletion" ADD CONSTRAINT "AcademyLessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "AcademyLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyLessonCompletion" ADD CONSTRAINT "AcademyLessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuizAttempt" ADD CONSTRAINT "AcademyQuizAttempt_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "AcademyEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuizAttempt" ADD CONSTRAINT "AcademyQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "AcademyQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuizAttempt" ADD CONSTRAINT "AcademyQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCertificate" ADD CONSTRAINT "AcademyCertificate_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "AcademyEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCertificate" ADD CONSTRAINT "AcademyCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyTrainingRecord" ADD CONSTRAINT "AcademyTrainingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyTrainingRecord" ADD CONSTRAINT "AcademyTrainingRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTrainingRequirement" ADD CONSTRAINT "WorkerTrainingRequirement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTrainingRequirement" ADD CONSTRAINT "WorkerTrainingRequirement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

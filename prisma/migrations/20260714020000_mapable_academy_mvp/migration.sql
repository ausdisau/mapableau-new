-- CreateEnum
CREATE TYPE "AcademyMembershipStatus" AS ENUM ('invited', 'active', 'suspended', 'left');

-- CreateEnum
CREATE TYPE "AcademyCourseStatus" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AcademyEnrolmentStatus" AS ENUM ('enrolled', 'in_progress', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "AcademyLessonProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "AcademyAttemptStatus" AS ENUM ('in_progress', 'submitted', 'scored');

-- CreateEnum
CREATE TYPE "AcademyCredentialStatus" AS ENUM ('issued', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "AcademyReviewDecision" AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');

-- CreateEnum
CREATE TYPE "AcademyAssignmentStatus" AS ENUM ('assigned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AcademyCapabilityLevel" AS ENUM ('none', 'bronze', 'silver', 'gold');

-- CreateTable
CREATE TABLE "academy_organisations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "retentionDays" INTEGER,
    "deletionRequestedAt" TIMESTAMP(3),
    "settingsJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_memberships" (
    "id" TEXT NOT NULL,
    "academyOrganisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AcademyMembershipStatus" NOT NULL DEFAULT 'active',
    "entitlements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retentionUntil" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_learner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "publicCredentialsOptIn" BOOLEAN NOT NULL DEFAULT false,
    "capabilityLevel" "AcademyCapabilityLevel" NOT NULL DEFAULT 'none',
    "preferencesJson" JSONB NOT NULL DEFAULT '{}',
    "retentionUntil" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_learner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_course_versions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AcademyCourseStatus" NOT NULL DEFAULT 'draft',
    "contentHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "isImmutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_modules" (
    "id" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "easyReadMarkdown" TEXT,
    "transcript" TEXT,
    "captionsVtt" TEXT,
    "audioDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_learning_paths" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AcademyCourseStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_learning_path_courses" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "academy_learning_path_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_enrolments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "organisationId" TEXT,
    "status" "AcademyEnrolmentStatus" NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_enrolments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_lesson_progress" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "AcademyLessonProgressStatus" NOT NULL DEFAULT 'not_started',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "lastPosition" TEXT,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_assessments" (
    "id" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "timeLimitMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_assessment_questions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "academy_assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_assessment_attempts" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AcademyAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "answersJson" JSONB NOT NULL DEFAULT '[]',
    "score" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_competency_frameworks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_competency_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_competencies" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "academy_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_course_competencies" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,

    CONSTRAINT "academy_course_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_evidence_artifacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT,
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "retentionUntil" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_evidence_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_assessor_reviews" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "decision" "AcademyReviewDecision" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_assessor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_credentials" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL DEFAULT 'MapAble Academy',
    "achievementTitle" TEXT NOT NULL,
    "status" "AcademyCredentialStatus" NOT NULL DEFAULT 'issued',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "evidenceSummary" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verifiable',
    "publicDisplay" BOOLEAN NOT NULL DEFAULT false,
    "retentionUntil" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_credential_expiries" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "academy_credential_expiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_learning_assignments" (
    "id" TEXT NOT NULL,
    "academyOrganisationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "enrolmentId" TEXT,
    "status" "AcademyAssignmentStatus" NOT NULL DEFAULT 'assigned',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_learning_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_policy_documents" (
    "id" TEXT NOT NULL,
    "academyOrganisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_policy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_policy_acknowledgements" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_practice_standard_mappings" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "standardCode" TEXT NOT NULL,
    "standardTitle" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "academy_practice_standard_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_content_reviews" (
    "id" TEXT NOT NULL,
    "courseVersionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewRole" TEXT NOT NULL,
    "decision" "AcademyReviewDecision" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_content_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_audit_events" (
    "id" TEXT NOT NULL,
    "auditEventId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "organisationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_organisations_organisationId_key" ON "academy_organisations"("organisationId");

-- CreateIndex
CREATE INDEX "academy_memberships_userId_idx" ON "academy_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_memberships_academyOrganisationId_userId_key" ON "academy_memberships"("academyOrganisationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_learner_profiles_userId_key" ON "academy_learner_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_courses_slug_key" ON "academy_courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "academy_courses_code_key" ON "academy_courses"("code");

-- CreateIndex
CREATE INDEX "academy_course_versions_status_idx" ON "academy_course_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "academy_course_versions_courseId_versionNumber_key" ON "academy_course_versions"("courseId", "versionNumber");

-- CreateIndex
CREATE INDEX "academy_modules_courseVersionId_idx" ON "academy_modules"("courseVersionId");

-- CreateIndex
CREATE INDEX "academy_lessons_moduleId_idx" ON "academy_lessons"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_lessons_moduleId_slug_key" ON "academy_lessons"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "academy_learning_paths_slug_key" ON "academy_learning_paths"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "academy_learning_path_courses_learningPathId_courseId_key" ON "academy_learning_path_courses"("learningPathId", "courseId");

-- CreateIndex
CREATE INDEX "academy_enrolments_userId_idx" ON "academy_enrolments"("userId");

-- CreateIndex
CREATE INDEX "academy_enrolments_courseVersionId_idx" ON "academy_enrolments"("courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_enrolments_userId_courseVersionId_key" ON "academy_enrolments"("userId", "courseVersionId");

-- CreateIndex
CREATE INDEX "academy_lesson_progress_enrolmentId_idx" ON "academy_lesson_progress"("enrolmentId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_lesson_progress_enrolmentId_lessonId_key" ON "academy_lesson_progress"("enrolmentId", "lessonId");

-- CreateIndex
CREATE INDEX "academy_assessments_courseVersionId_idx" ON "academy_assessments"("courseVersionId");

-- CreateIndex
CREATE INDEX "academy_assessment_questions_assessmentId_idx" ON "academy_assessment_questions"("assessmentId");

-- CreateIndex
CREATE INDEX "academy_assessment_attempts_enrolmentId_idx" ON "academy_assessment_attempts"("enrolmentId");

-- CreateIndex
CREATE INDEX "academy_assessment_attempts_userId_idx" ON "academy_assessment_attempts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_competency_frameworks_code_key" ON "academy_competency_frameworks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "academy_competencies_frameworkId_code_key" ON "academy_competencies"("frameworkId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "academy_course_competencies_courseId_competencyId_key" ON "academy_course_competencies"("courseId", "competencyId");

-- CreateIndex
CREATE INDEX "academy_evidence_artifacts_userId_idx" ON "academy_evidence_artifacts"("userId");

-- CreateIndex
CREATE INDEX "academy_assessor_reviews_assessorId_idx" ON "academy_assessor_reviews"("assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_credentials_publicId_key" ON "academy_credentials"("publicId");

-- CreateIndex
CREATE INDEX "academy_credentials_userId_idx" ON "academy_credentials"("userId");

-- CreateIndex
CREATE INDEX "academy_credentials_publicId_idx" ON "academy_credentials"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_credential_expiries_credentialId_key" ON "academy_credential_expiries"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_learning_assignments_enrolmentId_key" ON "academy_learning_assignments"("enrolmentId");

-- CreateIndex
CREATE INDEX "academy_learning_assignments_academyOrganisationId_idx" ON "academy_learning_assignments"("academyOrganisationId");

-- CreateIndex
CREATE INDEX "academy_learning_assignments_learnerUserId_idx" ON "academy_learning_assignments"("learnerUserId");

-- CreateIndex
CREATE INDEX "academy_policy_documents_academyOrganisationId_idx" ON "academy_policy_documents"("academyOrganisationId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_policy_acknowledgements_policyId_userId_key" ON "academy_policy_acknowledgements"("policyId", "userId");

-- CreateIndex
CREATE INDEX "academy_practice_standard_mappings_courseId_idx" ON "academy_practice_standard_mappings"("courseId");

-- CreateIndex
CREATE INDEX "academy_content_reviews_courseVersionId_idx" ON "academy_content_reviews"("courseVersionId");

-- CreateIndex
CREATE INDEX "academy_audit_events_action_idx" ON "academy_audit_events"("action");

-- CreateIndex
CREATE INDEX "academy_audit_events_createdAt_idx" ON "academy_audit_events"("createdAt");

-- AddForeignKey
ALTER TABLE "academy_organisations" ADD CONSTRAINT "academy_organisations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_memberships" ADD CONSTRAINT "academy_memberships_academyOrganisationId_fkey" FOREIGN KEY ("academyOrganisationId") REFERENCES "academy_organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_memberships" ADD CONSTRAINT "academy_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learner_profiles" ADD CONSTRAINT "academy_learner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_versions" ADD CONSTRAINT "academy_course_versions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_modules" ADD CONSTRAINT "academy_modules_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "academy_course_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_lessons" ADD CONSTRAINT "academy_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "academy_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_path_courses" ADD CONSTRAINT "academy_learning_path_courses_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "academy_learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_path_courses" ADD CONSTRAINT "academy_learning_path_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_enrolments" ADD CONSTRAINT "academy_enrolments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_enrolments" ADD CONSTRAINT "academy_enrolments_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "academy_course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "academy_enrolments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "academy_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessments" ADD CONSTRAINT "academy_assessments_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "academy_course_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessment_questions" ADD CONSTRAINT "academy_assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "academy_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessment_attempts" ADD CONSTRAINT "academy_assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "academy_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessment_attempts" ADD CONSTRAINT "academy_assessment_attempts_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "academy_enrolments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessment_attempts" ADD CONSTRAINT "academy_assessment_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_competencies" ADD CONSTRAINT "academy_competencies_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "academy_competency_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_competencies" ADD CONSTRAINT "academy_course_competencies_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_competencies" ADD CONSTRAINT "academy_course_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "academy_competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_evidence_artifacts" ADD CONSTRAINT "academy_evidence_artifacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_evidence_artifacts" ADD CONSTRAINT "academy_evidence_artifacts_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "academy_competencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessor_reviews" ADD CONSTRAINT "academy_assessor_reviews_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "academy_evidence_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assessor_reviews" ADD CONSTRAINT "academy_assessor_reviews_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_credentials" ADD CONSTRAINT "academy_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_credentials" ADD CONSTRAINT "academy_credentials_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "academy_enrolments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_credentials" ADD CONSTRAINT "academy_credentials_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "academy_course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_credential_expiries" ADD CONSTRAINT "academy_credential_expiries_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "academy_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_assignments" ADD CONSTRAINT "academy_learning_assignments_academyOrganisationId_fkey" FOREIGN KEY ("academyOrganisationId") REFERENCES "academy_organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_assignments" ADD CONSTRAINT "academy_learning_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_assignments" ADD CONSTRAINT "academy_learning_assignments_learnerUserId_fkey" FOREIGN KEY ("learnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_assignments" ADD CONSTRAINT "academy_learning_assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_learning_assignments" ADD CONSTRAINT "academy_learning_assignments_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "academy_enrolments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_policy_documents" ADD CONSTRAINT "academy_policy_documents_academyOrganisationId_fkey" FOREIGN KEY ("academyOrganisationId") REFERENCES "academy_organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_policy_acknowledgements" ADD CONSTRAINT "academy_policy_acknowledgements_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "academy_policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_policy_acknowledgements" ADD CONSTRAINT "academy_policy_acknowledgements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_practice_standard_mappings" ADD CONSTRAINT "academy_practice_standard_mappings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "academy_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_content_reviews" ADD CONSTRAINT "academy_content_reviews_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "academy_course_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_content_reviews" ADD CONSTRAINT "academy_content_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_audit_events" ADD CONSTRAINT "academy_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Row Level Security (defence in depth). Application services remain mandatory.
-- Session GUC: app.current_user_id (text user id)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'academy_organisations',
    'academy_memberships',
    'academy_learner_profiles',
    'academy_courses',
    'academy_course_versions',
    'academy_modules',
    'academy_lessons',
    'academy_learning_paths',
    'academy_learning_path_courses',
    'academy_enrolments',
    'academy_lesson_progress',
    'academy_assessments',
    'academy_assessment_questions',
    'academy_assessment_attempts',
    'academy_competency_frameworks',
    'academy_competencies',
    'academy_course_competencies',
    'academy_evidence_artifacts',
    'academy_assessor_reviews',
    'academy_credentials',
    'academy_credential_expiries',
    'academy_learning_assignments',
    'academy_policy_documents',
    'academy_policy_acknowledgements',
    'academy_practice_standard_mappings',
    'academy_content_reviews',
    'academy_audit_events'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Optional restricted-role testing note:
-- ENABLE ROW LEVEL SECURITY applies to non-owner roles. Prisma table owners bypass RLS
-- unless FORCE is set (intentionally not used so Neon/Prisma app connections keep working).
-- For RLS tests, connect as a non-owner role and SET app.current_user_id = '<userId>'.

-- Public catalogue: published course versions readable by anyone (including anon)
CREATE POLICY academy_courses_public_read ON academy_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_course_versions v
      WHERE v."courseId" = academy_courses.id AND v.status = 'published'
    )
  );

CREATE POLICY academy_course_versions_public_read ON academy_course_versions
  FOR SELECT USING (status = 'published');

CREATE POLICY academy_modules_public_read ON academy_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_course_versions v
      WHERE v.id = academy_modules."courseVersionId" AND v.status = 'published'
    )
  );

CREATE POLICY academy_lessons_public_read ON academy_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_modules m
      JOIN academy_course_versions v ON v.id = m."courseVersionId"
      WHERE m.id = academy_lessons."moduleId" AND v.status = 'published'
    )
  );

CREATE POLICY academy_paths_public_read ON academy_learning_paths
  FOR SELECT USING (status = 'published');

CREATE POLICY academy_path_courses_public_read ON academy_learning_path_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_learning_paths p
      WHERE p.id = academy_learning_path_courses."learningPathId" AND p.status = 'published'
    )
  );

CREATE POLICY academy_practice_mappings_public_read ON academy_practice_standard_mappings
  FOR SELECT USING (true);

CREATE POLICY academy_frameworks_public_read ON academy_competency_frameworks
  FOR SELECT USING (true);

CREATE POLICY academy_competencies_public_read ON academy_competencies
  FOR SELECT USING (true);

CREATE POLICY academy_course_competencies_public_read ON academy_course_competencies
  FOR SELECT USING (true);

-- Learner own rows
CREATE POLICY academy_enrolments_own ON academy_enrolments
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_learner_profiles_own ON academy_learner_profiles
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_lesson_progress_own ON academy_lesson_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM academy_enrolments e
      WHERE e.id = academy_lesson_progress."enrolmentId"
        AND e."userId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_enrolments e
      WHERE e.id = academy_lesson_progress."enrolmentId"
        AND e."userId" = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY academy_attempts_own ON academy_assessment_attempts
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_credentials_own ON academy_credentials
  FOR SELECT USING (
    "userId" = current_setting('app.current_user_id', true)
    OR (
      "publicDisplay" = true
      AND status = 'issued'
      AND "revokedAt" IS NULL
    )
  );

CREATE POLICY academy_credentials_own_write ON academy_credentials
  FOR INSERT WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_evidence_own ON academy_evidence_artifacts
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_assessor_assigned ON academy_assessor_reviews
  FOR ALL USING ("assessorId" = current_setting('app.current_user_id', true))
  WITH CHECK ("assessorId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_memberships_own ON academy_memberships
  FOR SELECT USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_policy_ack_own ON academy_policy_acknowledgements
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_assignments_learner ON academy_learning_assignments
  FOR SELECT USING ("learnerUserId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_audit_actor_read ON academy_audit_events
  FOR SELECT USING (
    "actorUserId" = current_setting('app.current_user_id', true)
  );

-- Assessments readable for published versions (questions used in player; correctIndex protected in app layer)
CREATE POLICY academy_assessments_public_read ON academy_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_course_versions v
      WHERE v.id = academy_assessments."courseVersionId" AND v.status = 'published'
    )
  );

CREATE POLICY academy_questions_public_read ON academy_assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_assessments a
      JOIN academy_course_versions v ON v.id = a."courseVersionId"
      WHERE a.id = academy_assessment_questions."assessmentId" AND v.status = 'published'
    )
  );

CREATE POLICY academy_credential_expiry_read ON academy_credential_expiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_credentials c
      WHERE c.id = academy_credential_expiries."credentialId"
        AND (
          c."userId" = current_setting('app.current_user_id', true)
          OR (c."publicDisplay" = true AND c.status = 'issued')
        )
    )
  );

CREATE POLICY academy_orgs_member_read ON academy_organisations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_memberships m
      WHERE m."academyOrganisationId" = academy_organisations.id
        AND m."userId" = current_setting('app.current_user_id', true)
        AND m.status = 'active'
    )
  );

CREATE POLICY academy_content_reviews_reviewer ON academy_content_reviews
  FOR ALL USING ("reviewerId" = current_setting('app.current_user_id', true))
  WITH CHECK ("reviewerId" = current_setting('app.current_user_id', true));

CREATE POLICY academy_policy_docs_member_read ON academy_policy_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM academy_memberships m
      WHERE m."academyOrganisationId" = academy_policy_documents."academyOrganisationId"
        AND m."userId" = current_setting('app.current_user_id', true)
        AND m.status = 'active'
    )
  );

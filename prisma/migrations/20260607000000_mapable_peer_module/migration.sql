-- MapAble Peer Module

-- AlterEnum
ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'peer_mentor';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'peer_activity_read';
ALTER TYPE "NotificationCategory" ADD VALUE IF NOT EXISTS 'peer';

-- CreateEnum
CREATE TYPE "PeerDisplayNameMode" AS ENUM ('real_name', 'first_name_only', 'community_alias', 'anonymous_public');
CREATE TYPE "PeerProfileVisibility" AS ENUM ('private', 'circles_only', 'mentors_only', 'community');
CREATE TYPE "PeerProfileStatus" AS ENUM ('active', 'paused', 'suspended', 'deleted');
CREATE TYPE "PeerCircleType" AS ENUM ('open', 'moderated', 'invite_only', 'peer_mentor_led', 'program_based');
CREATE TYPE "PeerCircleStatus" AS ENUM ('active', 'archived');
CREATE TYPE "PeerPostStatus" AS ENUM ('draft', 'pending_moderation', 'published', 'hidden', 'rejected', 'deleted');
CREATE TYPE "PeerReportReason" AS ENUM ('abuse_or_harassment', 'privacy_violation', 'unsafe_advice', 'medical_or_legal_claim', 'self_harm_or_crisis', 'discrimination', 'spam', 'exploitation_or_scam', 'boundary_issue', 'other');
CREATE TYPE "PeerMentorRequestStatus" AS ENUM ('requested', 'mentor_review', 'accepted', 'declined', 'completed', 'cancelled', 'escalated');
CREATE TYPE "PeerModerationDecision" AS ENUM ('approve', 'hide', 'request_edit', 'warn_user', 'pause_account', 'remove_from_circle', 'escalate_support', 'escalate_complaint', 'escalate_safeguarding');
CREATE TYPE "PeerSafetyEventType" AS ENUM ('crisis_resources_shown', 'member_reported_crisis', 'moderator_escalation', 'automated_flag');
CREATE TYPE "PeerEventLocationType" AS ENUM ('online', 'in_person', 'hybrid');
CREATE TYPE "PeerContentSignalType" AS ENUM ('helped_me', 'saved', 'thanked');
CREATE TYPE "PeerModerationQueueStatus" AS ENUM ('open', 'in_review', 'resolved');

-- CreateTable
CREATE TABLE "PeerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileSlug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "displayNameMode" "PeerDisplayNameMode" NOT NULL DEFAULT 'community_alias',
    "livedExperienceTags" JSONB,
    "communicationPreferences" JSONB,
    "profileVisibility" "PeerProfileVisibility" NOT NULL DEFAULT 'circles_only',
    "status" "PeerProfileStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerPrivacySettings" (
    "id" TEXT NOT NULL,
    "peerProfileId" TEXT NOT NULL,
    "pauseCommunityNotifications" BOOLEAN NOT NULL DEFAULT false,
    "lockScreenSafeOnly" BOOLEAN NOT NULL DEFAULT true,
    "mutedCircleIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerPrivacySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerCircle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "circleType" "PeerCircleType" NOT NULL DEFAULT 'moderated',
    "accessibilityNotes" TEXT,
    "moderationLevel" TEXT NOT NULL DEFAULT 'standard',
    "status" "PeerCircleStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerCircle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerCircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "peerProfileId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PeerCircleMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerCirclePost" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "contentWarning" TEXT,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerCirclePost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerCircleReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'draft',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerCircleReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerQuestion" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "topic" TEXT,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'pending_moderation',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'pending_moderation',
    "moderatorHighlight" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerStoryItem" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "contentWarning" TEXT,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'pending_moderation',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerStoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerStoryComment" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PeerPostStatus" NOT NULL DEFAULT 'pending_moderation',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerStoryComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerMentorProfile" (
    "id" TEXT NOT NULL,
    "peerProfileId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "livedExperienceTopics" JSONB NOT NULL DEFAULT '[]',
    "boundaries" TEXT,
    "availabilityNotes" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerMentorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerMentorRequest" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT,
    "status" "PeerMentorRequestStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerMentorRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerSession" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "facilitatorName" TEXT,
    "accessibilityOptions" JSONB NOT NULL DEFAULT '{}',
    "capacity" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "locationType" "PeerEventLocationType" NOT NULL DEFAULT 'online',
    "meetingLinkPlaceholder" TEXT,
    "postEventResources" JSONB,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerEventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "peerProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerEventRsvp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" "PeerReportReason" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerModerationQueue" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "status" "PeerModerationQueueStatus" NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "autoFlags" JSONB,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerModerationQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerModerationAction" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "decision" "PeerModerationDecision" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerSafetyEvent" (
    "id" TEXT NOT NULL,
    "peerProfileId" TEXT,
    "contentType" TEXT,
    "contentId" TEXT,
    "eventType" "PeerSafetyEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerSafetyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerResourceLibrary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PeerResourceLibrary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeerContentSignal" (
    "id" TEXT NOT NULL,
    "peerProfileId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "signalType" "PeerContentSignalType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerContentSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PeerProfile_userId_key" ON "PeerProfile"("userId");
CREATE UNIQUE INDEX "PeerProfile_profileSlug_key" ON "PeerProfile"("profileSlug");
CREATE INDEX "PeerProfile_status_idx" ON "PeerProfile"("status");
CREATE UNIQUE INDEX "PeerPrivacySettings_peerProfileId_key" ON "PeerPrivacySettings"("peerProfileId");
CREATE INDEX "PeerCircle_topic_idx" ON "PeerCircle"("topic");
CREATE INDEX "PeerCircle_status_idx" ON "PeerCircle"("status");
CREATE UNIQUE INDEX "PeerCircleMember_circleId_peerProfileId_key" ON "PeerCircleMember"("circleId", "peerProfileId");
CREATE INDEX "PeerCirclePost_circleId_status_idx" ON "PeerCirclePost"("circleId", "status");
CREATE INDEX "PeerCirclePost_authorId_idx" ON "PeerCirclePost"("authorId");
CREATE INDEX "PeerCircleReply_postId_status_idx" ON "PeerCircleReply"("postId", "status");
CREATE INDEX "PeerQuestion_status_idx" ON "PeerQuestion"("status");
CREATE INDEX "PeerAnswer_questionId_status_idx" ON "PeerAnswer"("questionId", "status");
CREATE INDEX "PeerStoryItem_status_idx" ON "PeerStoryItem"("status");
CREATE UNIQUE INDEX "PeerMentorProfile_peerProfileId_key" ON "PeerMentorProfile"("peerProfileId");
CREATE INDEX "PeerMentorRequest_mentorProfileId_status_idx" ON "PeerMentorRequest"("mentorProfileId", "status");
CREATE UNIQUE INDEX "PeerEventRsvp_eventId_peerProfileId_key" ON "PeerEventRsvp"("eventId", "peerProfileId");
CREATE INDEX "PeerReport_contentType_contentId_idx" ON "PeerReport"("contentType", "contentId");
CREATE UNIQUE INDEX "PeerModerationQueue_reportId_key" ON "PeerModerationQueue"("reportId");
CREATE INDEX "PeerModerationQueue_status_priority_idx" ON "PeerModerationQueue"("status", "priority");
CREATE INDEX "PeerSafetyEvent_createdAt_idx" ON "PeerSafetyEvent"("createdAt");
CREATE UNIQUE INDEX "PeerContentSignal_peerProfileId_contentType_contentId_signalType_key" ON "PeerContentSignal"("peerProfileId", "contentType", "contentId", "signalType");

-- AddForeignKey
ALTER TABLE "PeerProfile" ADD CONSTRAINT "PeerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerPrivacySettings" ADD CONSTRAINT "PeerPrivacySettings_peerProfileId_fkey" FOREIGN KEY ("peerProfileId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCircleMember" ADD CONSTRAINT "PeerCircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "PeerCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCircleMember" ADD CONSTRAINT "PeerCircleMember_peerProfileId_fkey" FOREIGN KEY ("peerProfileId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCirclePost" ADD CONSTRAINT "PeerCirclePost_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "PeerCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCirclePost" ADD CONSTRAINT "PeerCirclePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCircleReply" ADD CONSTRAINT "PeerCircleReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PeerCirclePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerCircleReply" ADD CONSTRAINT "PeerCircleReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerQuestion" ADD CONSTRAINT "PeerQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerAnswer" ADD CONSTRAINT "PeerAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PeerQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerAnswer" ADD CONSTRAINT "PeerAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerStoryItem" ADD CONSTRAINT "PeerStoryItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PeerStoryComment" ADD CONSTRAINT "PeerStoryComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "PeerStoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerStoryComment" ADD CONSTRAINT "PeerStoryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerMentorProfile" ADD CONSTRAINT "PeerMentorProfile_peerProfileId_fkey" FOREIGN KEY ("peerProfileId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerMentorRequest" ADD CONSTRAINT "PeerMentorRequest_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "PeerMentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerMentorRequest" ADD CONSTRAINT "PeerMentorRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerSession" ADD CONSTRAINT "PeerSession_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PeerMentorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerSession" ADD CONSTRAINT "PeerSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "PeerMentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerEventRsvp" ADD CONSTRAINT "PeerEventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PeerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerEventRsvp" ADD CONSTRAINT "PeerEventRsvp_peerProfileId_fkey" FOREIGN KEY ("peerProfileId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerReport" ADD CONSTRAINT "PeerReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerModerationQueue" ADD CONSTRAINT "PeerModerationQueue_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PeerReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PeerModerationAction" ADD CONSTRAINT "PeerModerationAction_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "PeerModerationQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerContentSignal" ADD CONSTRAINT "PeerContentSignal_peerProfileId_fkey" FOREIGN KEY ("peerProfileId") REFERENCES "PeerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

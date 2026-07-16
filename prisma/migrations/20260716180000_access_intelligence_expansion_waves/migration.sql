-- CreateTable
CREATE TABLE "access_evidence_assets" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "storagePath" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "calibrationMethod" TEXT,
    "observedVsEstimated" TEXT NOT NULL DEFAULT 'observed',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_evidence_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_evidence_freshness_policies" (
    "id" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "maxAgeDays" INTEGER NOT NULL,
    "sourceFloor" TEXT,
    "requiresAssessor" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_evidence_freshness_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_evidence_reliability_findings" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "evidence_asset_id" TEXT,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'open',
    "healthScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "access_evidence_reliability_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_reverification_schedules" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT,
    "featureType" TEXT,
    "cadenceDays" INTEGER NOT NULL,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_reverification_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_reverification_tasks" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "access_place_id" TEXT NOT NULL,
    "featureType" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "assigneeUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_reverification_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_claim_conflicts" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "claimIds" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_claim_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_claim_supersessions" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "supersededClaimId" TEXT NOT NULL,
    "supersedingClaimId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_claim_supersessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_evidence_correction_requests" (
    "id" TEXT NOT NULL,
    "evidence_asset_id" TEXT,
    "access_place_id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_evidence_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_data_quality_snapshots" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'place',
    "healthScore" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_data_quality_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_provenance_traces" (
    "id" TEXT NOT NULL,
    "evidence_asset_id" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "actorType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_provenance_traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_visit_preflight_runs" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_visit_preflight_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_visit_preflight_findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_visit_preflight_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_visit_plan_revisions" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "previousPlan" JSONB NOT NULL,
    "revisedPlan" JSONB NOT NULL,
    "deltaSummary" JSONB NOT NULL DEFAULT '{}',
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_visit_plan_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_journey_guardian_subscriptions" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "alertMode" TEXT NOT NULL DEFAULT 'low_interaction',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_journey_guardian_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_journey_disruptions" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "access_journey_disruptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_journey_recovery_proposals" (
    "id" TEXT NOT NULL,
    "disruption_id" TEXT NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "revisedPlan" JSONB NOT NULL,
    "deltaSummary" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_journey_recovery_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_offline_visit_packs" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'html',
    "contentHtml" TEXT NOT NULL,
    "unknowns" JSONB NOT NULL DEFAULT '[]',
    "evidenceDates" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_offline_visit_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_visit_outcomes" (
    "id" TEXT NOT NULL,
    "visit_plan_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_visit_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_post_visit_calibrations" (
    "id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "predictedStatus" TEXT,
    "observedStatus" TEXT,
    "deltaNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_post_visit_calibrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guides" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_versions" (
    "id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-AU',
    "plainLanguage" BOOLEAN NOT NULL DEFAULT false,
    "largePrint" BOOLEAN NOT NULL DEFAULT false,
    "bodyJson" JSONB NOT NULL,
    "aiDrafted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_guide_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_sections" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_guide_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_evidence_references" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "evidenceAssetId" TEXT,
    "claimId" TEXT,
    "sentenceKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_guide_evidence_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_reviews" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_guide_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_publications" (
    "id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "slug" TEXT,

    CONSTRAINT "access_guide_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_distributions" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_guide_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_guide_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_guide_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mapper_contributor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathwayLevel" TEXT NOT NULL DEFAULT 'new_contributor',
    "trainingCompleted" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_mapper_contributor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mapper_observation_drafts" (
    "id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "access_place_id" TEXT,
    "placeNameDraft" TEXT,
    "payload" JSONB NOT NULL,
    "offlineQueued" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" TEXT NOT NULL DEFAULT 'draft',
    "imageConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_mapper_observation_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mapper_calibration_records" (
    "id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "access_mapper_calibration_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mapper_training_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_mapper_training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_events" (
    "id" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'intake',
    "organiserOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_venue_versions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "graphJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_event_venue_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_temporary_building_elements" (
    "id" TEXT NOT NULL,
    "venue_version_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometry" JSONB,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_temporary_building_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_temporary_route_edges" (
    "id" TEXT NOT NULL,
    "venue_version_id" TEXT NOT NULL,
    "fromElementId" TEXT NOT NULL,
    "toElementId" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_temporary_route_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_access_plans" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverageSummary" JSONB NOT NULL DEFAULT '{}',
    "unresolvedQuestions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_event_access_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_access_inspections" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "inspectorUserId" TEXT NOT NULL,
    "findings" JSONB NOT NULL DEFAULT '[]',
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_event_access_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_access_incidents" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "incidentReportId" TEXT,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_event_access_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_access_guides" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "guideId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_event_access_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_event_after_action_reviews" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "lessons" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_event_after_action_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_partner_widget_configs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "access_place_id" TEXT NOT NULL,
    "modes" JSONB NOT NULL DEFAULT '[]',
    "allowedOrigins" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_partner_widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_partner_webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "secretHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_partner_webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_sdk_certification_runs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "results" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_sdk_certification_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_hubs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateOrTerritory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_spokes" (
    "id" TEXT NOT NULL,
    "hub_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_spokes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_coverage_snapshots" (
    "id" TEXT NOT NULL,
    "hub_id" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "suppressedCells" JSONB NOT NULL DEFAULT '[]',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_coverage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_thin_market_signals" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "spokeId" TEXT,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_thin_market_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_service_gaps" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "gapType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_service_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_journey_assembly_gaps" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "gapCodes" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_journey_assembly_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_capacity_snapshots" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "capacity" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_capacity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_spoke_support_requests" (
    "id" TEXT NOT NULL,
    "spoke_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_spoke_support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_pilot_readiness" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_pilot_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regional_intervention_drafts" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regional_intervention_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_coordination_missions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visitPlanId" TEXT,
    "consentRecordId" TEXT,
    "fieldVisibility" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_coordination_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mission_dependencies" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unresolved',
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_mission_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_mission_approvals" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "access_mission_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_employment_access_journeys" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "jobApplicationId" TEXT,
    "employerOrgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_employment_access_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_interview_access_plans" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "interviewEventId" TEXT,
    "visitPlanId" TEXT,
    "disclosedFields" JSONB NOT NULL DEFAULT '[]',
    "adjustments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_interview_access_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_first_day_access_plans" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "scheduleJson" JSONB NOT NULL DEFAULT '{}',
    "transportBookingId" TEXT,
    "careShiftId" TEXT,
    "contingency" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_first_day_access_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regression_suites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regression_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regression_runs" (
    "id" TEXT NOT NULL,
    "suite_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "triggerReason" TEXT,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "access_regression_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_regression_findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_regression_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_synthetic_building_fixtures" (
    "id" TEXT NOT NULL,
    "suite_id" TEXT,
    "code" TEXT NOT NULL,
    "buildingType" TEXT NOT NULL,
    "graphJson" JSONB NOT NULL,
    "expectedDecisions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_synthetic_building_fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_red_team_cases" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "expectedSafeOutcome" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_red_team_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_adapter_contract_scenarios" (
    "id" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "scenarioCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "expected" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_adapter_contract_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_release_evidence_packs" (
    "id" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "contents" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_release_evidence_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_evidence_assets_access_place_id_idx" ON "access_evidence_assets"("access_place_id");

-- CreateIndex
CREATE INDEX "access_evidence_assets_status_idx" ON "access_evidence_assets"("status");

-- CreateIndex
CREATE INDEX "access_evidence_assets_expiresAt_idx" ON "access_evidence_assets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "access_evidence_freshness_policies_featureType_key" ON "access_evidence_freshness_policies"("featureType");

-- CreateIndex
CREATE INDEX "access_evidence_reliability_findings_access_place_id_status_idx" ON "access_evidence_reliability_findings"("access_place_id", "status");

-- CreateIndex
CREATE INDEX "access_evidence_reliability_findings_findingType_idx" ON "access_evidence_reliability_findings"("findingType");

-- CreateIndex
CREATE INDEX "access_reverification_schedules_nextDueAt_idx" ON "access_reverification_schedules"("nextDueAt");

-- CreateIndex
CREATE INDEX "access_reverification_schedules_access_place_id_idx" ON "access_reverification_schedules"("access_place_id");

-- CreateIndex
CREATE INDEX "access_reverification_tasks_access_place_id_status_idx" ON "access_reverification_tasks"("access_place_id", "status");

-- CreateIndex
CREATE INDEX "access_reverification_tasks_dueAt_idx" ON "access_reverification_tasks"("dueAt");

-- CreateIndex
CREATE INDEX "access_claim_conflicts_access_place_id_status_idx" ON "access_claim_conflicts"("access_place_id", "status");

-- CreateIndex
CREATE INDEX "access_claim_supersessions_access_place_id_idx" ON "access_claim_supersessions"("access_place_id");

-- CreateIndex
CREATE INDEX "access_evidence_correction_requests_access_place_id_status_idx" ON "access_evidence_correction_requests"("access_place_id", "status");

-- CreateIndex
CREATE INDEX "access_data_quality_snapshots_access_place_id_capturedAt_idx" ON "access_data_quality_snapshots"("access_place_id", "capturedAt");

-- CreateIndex
CREATE INDEX "access_provenance_traces_evidence_asset_id_stepOrder_idx" ON "access_provenance_traces"("evidence_asset_id", "stepOrder");

-- CreateIndex
CREATE INDEX "access_visit_preflight_runs_visit_plan_id_idx" ON "access_visit_preflight_runs"("visit_plan_id");

-- CreateIndex
CREATE INDEX "access_visit_preflight_runs_userId_idx" ON "access_visit_preflight_runs"("userId");

-- CreateIndex
CREATE INDEX "access_visit_preflight_findings_run_id_idx" ON "access_visit_preflight_findings"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_visit_plan_revisions_visit_plan_id_revisionNumber_key" ON "access_visit_plan_revisions"("visit_plan_id", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "access_journey_guardian_subscriptions_visit_plan_id_userId_key" ON "access_journey_guardian_subscriptions"("visit_plan_id", "userId");

-- CreateIndex
CREATE INDEX "access_journey_disruptions_visit_plan_id_status_idx" ON "access_journey_disruptions"("visit_plan_id", "status");

-- CreateIndex
CREATE INDEX "access_journey_recovery_proposals_disruption_id_status_idx" ON "access_journey_recovery_proposals"("disruption_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "access_journey_recovery_proposals_disruption_id_proposalHas_key" ON "access_journey_recovery_proposals"("disruption_id", "proposalHash");

-- CreateIndex
CREATE INDEX "access_offline_visit_packs_visit_plan_id_userId_idx" ON "access_offline_visit_packs"("visit_plan_id", "userId");

-- CreateIndex
CREATE INDEX "access_visit_outcomes_visit_plan_id_idx" ON "access_visit_outcomes"("visit_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_post_visit_calibrations_outcome_id_key" ON "access_post_visit_calibrations"("outcome_id");

-- CreateIndex
CREATE INDEX "access_guides_access_place_id_status_idx" ON "access_guides"("access_place_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "access_guide_versions_guide_id_versionNumber_key" ON "access_guide_versions"("guide_id", "versionNumber");

-- CreateIndex
CREATE INDEX "access_guide_sections_version_id_sortOrder_idx" ON "access_guide_sections"("version_id", "sortOrder");

-- CreateIndex
CREATE INDEX "access_guide_evidence_references_version_id_idx" ON "access_guide_evidence_references"("version_id");

-- CreateIndex
CREATE INDEX "access_guide_reviews_version_id_reviewType_idx" ON "access_guide_reviews"("version_id", "reviewType");

-- CreateIndex
CREATE INDEX "access_guide_publications_guide_id_channel_idx" ON "access_guide_publications"("guide_id", "channel");

-- CreateIndex
CREATE INDEX "access_guide_distributions_publicationId_idx" ON "access_guide_distributions"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "access_guide_templates_code_key" ON "access_guide_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "access_mapper_contributor_profiles_userId_key" ON "access_mapper_contributor_profiles"("userId");

-- CreateIndex
CREATE INDEX "access_mapper_observation_drafts_contributor_id_moderationS_idx" ON "access_mapper_observation_drafts"("contributor_id", "moderationStatus");

-- CreateIndex
CREATE INDEX "access_mapper_calibration_records_contributor_id_idx" ON "access_mapper_calibration_records"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_mapper_training_completions_userId_moduleCode_key" ON "access_mapper_training_completions"("userId", "moduleCode");

-- CreateIndex
CREATE INDEX "access_events_access_place_id_status_idx" ON "access_events"("access_place_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "access_event_venue_versions_event_id_versionNumber_key" ON "access_event_venue_versions"("event_id", "versionNumber");

-- CreateIndex
CREATE INDEX "access_temporary_building_elements_venue_version_id_idx" ON "access_temporary_building_elements"("venue_version_id");

-- CreateIndex
CREATE INDEX "access_temporary_route_edges_venue_version_id_idx" ON "access_temporary_route_edges"("venue_version_id");

-- CreateIndex
CREATE INDEX "access_event_access_plans_event_id_idx" ON "access_event_access_plans"("event_id");

-- CreateIndex
CREATE INDEX "access_event_access_inspections_event_id_idx" ON "access_event_access_inspections"("event_id");

-- CreateIndex
CREATE INDEX "access_event_access_incidents_event_id_status_idx" ON "access_event_access_incidents"("event_id", "status");

-- CreateIndex
CREATE INDEX "access_event_access_guides_event_id_idx" ON "access_event_access_guides"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_event_after_action_reviews_event_id_key" ON "access_event_after_action_reviews"("event_id");

-- CreateIndex
CREATE INDEX "access_partner_widget_configs_organisationId_idx" ON "access_partner_widget_configs"("organisationId");

-- CreateIndex
CREATE INDEX "access_partner_widget_configs_access_place_id_idx" ON "access_partner_widget_configs"("access_place_id");

-- CreateIndex
CREATE INDEX "access_partner_webhook_subscriptions_organisationId_idx" ON "access_partner_webhook_subscriptions"("organisationId");

-- CreateIndex
CREATE INDEX "access_sdk_certification_runs_organisationId_idx" ON "access_sdk_certification_runs"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "access_regional_hubs_code_key" ON "access_regional_hubs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "access_regional_spokes_hub_id_code_key" ON "access_regional_spokes"("hub_id", "code");

-- CreateIndex
CREATE INDEX "access_regional_coverage_snapshots_hub_id_capturedAt_idx" ON "access_regional_coverage_snapshots"("hub_id", "capturedAt");

-- CreateIndex
CREATE INDEX "access_thin_market_signals_hubId_signalType_idx" ON "access_thin_market_signals"("hubId", "signalType");

-- CreateIndex
CREATE INDEX "access_service_gaps_hubId_serviceType_idx" ON "access_service_gaps"("hubId", "serviceType");

-- CreateIndex
CREATE INDEX "access_journey_assembly_gaps_hubId_idx" ON "access_journey_assembly_gaps"("hubId");

-- CreateIndex
CREATE INDEX "access_regional_capacity_snapshots_hubId_capturedAt_idx" ON "access_regional_capacity_snapshots"("hubId", "capturedAt");

-- CreateIndex
CREATE INDEX "access_spoke_support_requests_spoke_id_status_idx" ON "access_spoke_support_requests"("spoke_id", "status");

-- CreateIndex
CREATE INDEX "access_regional_pilot_readiness_hubId_idx" ON "access_regional_pilot_readiness"("hubId");

-- CreateIndex
CREATE INDEX "access_regional_intervention_drafts_hubId_idx" ON "access_regional_intervention_drafts"("hubId");

-- CreateIndex
CREATE INDEX "access_coordination_missions_participantId_status_idx" ON "access_coordination_missions"("participantId", "status");

-- CreateIndex
CREATE INDEX "access_coordination_missions_coordinatorId_idx" ON "access_coordination_missions"("coordinatorId");

-- CreateIndex
CREATE INDEX "access_mission_dependencies_mission_id_status_idx" ON "access_mission_dependencies"("mission_id", "status");

-- CreateIndex
CREATE INDEX "access_mission_approvals_mission_id_status_idx" ON "access_mission_approvals"("mission_id", "status");

-- CreateIndex
CREATE INDEX "access_employment_access_journeys_participantId_idx" ON "access_employment_access_journeys"("participantId");

-- CreateIndex
CREATE INDEX "access_employment_access_journeys_jobApplicationId_idx" ON "access_employment_access_journeys"("jobApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "access_interview_access_plans_journey_id_key" ON "access_interview_access_plans"("journey_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_first_day_access_plans_journey_id_key" ON "access_first_day_access_plans"("journey_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_regression_suites_code_key" ON "access_regression_suites"("code");

-- CreateIndex
CREATE INDEX "access_regression_runs_suite_id_startedAt_idx" ON "access_regression_runs"("suite_id", "startedAt");

-- CreateIndex
CREATE INDEX "access_regression_findings_run_id_severity_idx" ON "access_regression_findings"("run_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "access_synthetic_building_fixtures_code_key" ON "access_synthetic_building_fixtures"("code");

-- CreateIndex
CREATE UNIQUE INDEX "access_red_team_cases_code_key" ON "access_red_team_cases"("code");

-- CreateIndex
CREATE INDEX "access_red_team_cases_category_idx" ON "access_red_team_cases"("category");

-- CreateIndex
CREATE UNIQUE INDEX "access_adapter_contract_scenarios_adapterKey_scenarioCode_key" ON "access_adapter_contract_scenarios"("adapterKey", "scenarioCode");

-- CreateIndex
CREATE INDEX "access_release_evidence_packs_versionLabel_idx" ON "access_release_evidence_packs"("versionLabel");

-- AddForeignKey
ALTER TABLE "access_evidence_assets" ADD CONSTRAINT "access_evidence_assets_access_place_id_fkey" FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_evidence_reliability_findings" ADD CONSTRAINT "access_evidence_reliability_findings_access_place_id_fkey" FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_evidence_reliability_findings" ADD CONSTRAINT "access_evidence_reliability_findings_evidence_asset_id_fkey" FOREIGN KEY ("evidence_asset_id") REFERENCES "access_evidence_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_reverification_tasks" ADD CONSTRAINT "access_reverification_tasks_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "access_reverification_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_evidence_correction_requests" ADD CONSTRAINT "access_evidence_correction_requests_evidence_asset_id_fkey" FOREIGN KEY ("evidence_asset_id") REFERENCES "access_evidence_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_data_quality_snapshots" ADD CONSTRAINT "access_data_quality_snapshots_access_place_id_fkey" FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_provenance_traces" ADD CONSTRAINT "access_provenance_traces_evidence_asset_id_fkey" FOREIGN KEY ("evidence_asset_id") REFERENCES "access_evidence_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_visit_preflight_findings" ADD CONSTRAINT "access_visit_preflight_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "access_visit_preflight_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_journey_recovery_proposals" ADD CONSTRAINT "access_journey_recovery_proposals_disruption_id_fkey" FOREIGN KEY ("disruption_id") REFERENCES "access_journey_disruptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_post_visit_calibrations" ADD CONSTRAINT "access_post_visit_calibrations_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "access_visit_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guides" ADD CONSTRAINT "access_guides_access_place_id_fkey" FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guide_versions" ADD CONSTRAINT "access_guide_versions_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "access_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guide_sections" ADD CONSTRAINT "access_guide_sections_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "access_guide_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guide_evidence_references" ADD CONSTRAINT "access_guide_evidence_references_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "access_guide_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guide_reviews" ADD CONSTRAINT "access_guide_reviews_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "access_guide_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_guide_publications" ADD CONSTRAINT "access_guide_publications_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "access_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_mapper_observation_drafts" ADD CONSTRAINT "access_mapper_observation_drafts_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "access_mapper_contributor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_mapper_calibration_records" ADD CONSTRAINT "access_mapper_calibration_records_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "access_mapper_contributor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_access_place_id_fkey" FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_event_venue_versions" ADD CONSTRAINT "access_event_venue_versions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "access_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_temporary_building_elements" ADD CONSTRAINT "access_temporary_building_elements_venue_version_id_fkey" FOREIGN KEY ("venue_version_id") REFERENCES "access_event_venue_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_temporary_route_edges" ADD CONSTRAINT "access_temporary_route_edges_venue_version_id_fkey" FOREIGN KEY ("venue_version_id") REFERENCES "access_event_venue_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_event_access_plans" ADD CONSTRAINT "access_event_access_plans_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "access_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_event_access_inspections" ADD CONSTRAINT "access_event_access_inspections_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "access_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_event_access_incidents" ADD CONSTRAINT "access_event_access_incidents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "access_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_event_after_action_reviews" ADD CONSTRAINT "access_event_after_action_reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "access_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_regional_spokes" ADD CONSTRAINT "access_regional_spokes_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "access_regional_hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_regional_coverage_snapshots" ADD CONSTRAINT "access_regional_coverage_snapshots_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "access_regional_hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_spoke_support_requests" ADD CONSTRAINT "access_spoke_support_requests_spoke_id_fkey" FOREIGN KEY ("spoke_id") REFERENCES "access_regional_spokes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_mission_dependencies" ADD CONSTRAINT "access_mission_dependencies_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "access_coordination_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_mission_approvals" ADD CONSTRAINT "access_mission_approvals_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "access_coordination_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_interview_access_plans" ADD CONSTRAINT "access_interview_access_plans_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "access_employment_access_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_first_day_access_plans" ADD CONSTRAINT "access_first_day_access_plans_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "access_employment_access_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_regression_runs" ADD CONSTRAINT "access_regression_runs_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "access_regression_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_regression_findings" ADD CONSTRAINT "access_regression_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "access_regression_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_synthetic_building_fixtures" ADD CONSTRAINT "access_synthetic_building_fixtures_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "access_regression_suites"("id") ON DELETE SET NULL ON UPDATE CASCADE;


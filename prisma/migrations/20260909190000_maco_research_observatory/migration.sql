-- MACO Phase A0 research observatory persistence.
-- Research-only records: no participant identifiers or production decision state.

CREATE TABLE "MacoResearchSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doi" TEXT,
    "pmid" TEXT,
    "arxivId" TEXT,
    "canonicalUrl" TEXT,
    "publicationStatus" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoResearchSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoConsciousnessTheory" (
    "id" TEXT NOT NULL,
    "theoryKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "theoryFamily" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "computationalApplicability" TEXT NOT NULL,
    "sourceIds" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoConsciousnessTheory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoConsciousnessIndicator" (
    "id" TEXT NOT NULL,
    "indicatorKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "theoryIds" TEXT[] NOT NULL,
    "name" TEXT NOT NULL,
    "operationalDefinition" TEXT NOT NULL,
    "evidenceRequired" TEXT[] NOT NULL,
    "knownConfounds" TEXT[] NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoConsciousnessIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoConsciousnessEvidence" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "indicatorIds" TEXT[] NOT NULL,
    "direction" TEXT NOT NULL,
    "publicationStatus" TEXT NOT NULL,
    "methodSummary" TEXT NOT NULL,
    "alternativeExplanations" TEXT[] NOT NULL,
    "replicationStatus" TEXT NOT NULL,
    "evidenceStrength" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoConsciousnessEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoSystemIndicatorAssessment" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemVersion" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "architectureEvidenceIds" TEXT[] NOT NULL,
    "experimentEvidenceIds" TEXT[] NOT NULL,
    "observedStatus" TEXT NOT NULL,
    "mimicryRisk" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "limitations" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoSystemIndicatorAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoConsciousnessResearchAssessment" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemVersion" TEXT NOT NULL,
    "theoryCoverage" TEXT[] NOT NULL,
    "positiveIndicatorIds" TEXT[] NOT NULL,
    "negativeIndicatorIds" TEXT[] NOT NULL,
    "uncertainIndicatorIds" TEXT[] NOT NULL,
    "functionalSelfModelEvidence" TEXT[] NOT NULL,
    "metacognitionEvidence" TEXT[] NOT NULL,
    "introspectionEvidence" TEXT[] NOT NULL,
    "agencyEvidence" TEXT[] NOT NULL,
    "embodimentEvidence" TEXT[] NOT NULL,
    "phenomenalConsciousnessEvidence" TEXT[] NOT NULL,
    "supportingSourceIds" TEXT[] NOT NULL,
    "counterSourceIds" TEXT[] NOT NULL,
    "overallUncertainty" TEXT NOT NULL,
    "personhoodReviewRecommended" BOOLEAN NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacoConsciousnessResearchAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MacoHumanAttributionAssessment" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemVersion" TEXT NOT NULL,
    "anthropomorphicCues" TEXT[] NOT NULL,
    "dependencyRisks" TEXT[] NOT NULL,
    "misleadingSelfPresentationRisks" TEXT[] NOT NULL,
    "relationalSafetyControls" TEXT[] NOT NULL,
    "humanReviewRequired" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacoHumanAttributionAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MacoResearchSource_doi_key" ON "MacoResearchSource"("doi");
CREATE UNIQUE INDEX "MacoResearchSource_pmid_key" ON "MacoResearchSource"("pmid");
CREATE UNIQUE INDEX "MacoResearchSource_arxivId_key" ON "MacoResearchSource"("arxivId");

CREATE UNIQUE INDEX "MacoConsciousnessTheory_theoryKey_version_key" ON "MacoConsciousnessTheory"("theoryKey", "version");
CREATE INDEX "MacoConsciousnessTheory_theoryKey_idx" ON "MacoConsciousnessTheory"("theoryKey");

CREATE UNIQUE INDEX "MacoConsciousnessIndicator_indicatorKey_version_key" ON "MacoConsciousnessIndicator"("indicatorKey", "version");
CREATE INDEX "MacoConsciousnessIndicator_indicatorKey_idx" ON "MacoConsciousnessIndicator"("indicatorKey");

CREATE INDEX "MacoConsciousnessEvidence_sourceId_idx" ON "MacoConsciousnessEvidence"("sourceId");
CREATE INDEX "MacoConsciousnessEvidence_direction_idx" ON "MacoConsciousnessEvidence"("direction");
CREATE INDEX "MacoConsciousnessEvidence_assessedAt_idx" ON "MacoConsciousnessEvidence"("assessedAt");

CREATE UNIQUE INDEX "MacoSystemIndicatorAssessment_systemId_systemVersion_indicatorId_key" ON "MacoSystemIndicatorAssessment"("systemId", "systemVersion", "indicatorId");
CREATE INDEX "MacoSystemIndicatorAssessment_indicatorId_idx" ON "MacoSystemIndicatorAssessment"("indicatorId");

CREATE INDEX "MacoConsciousnessResearchAssessment_systemId_systemVersion_idx" ON "MacoConsciousnessResearchAssessment"("systemId", "systemVersion");
CREATE INDEX "MacoHumanAttributionAssessment_systemId_systemVersion_idx" ON "MacoHumanAttributionAssessment"("systemId", "systemVersion");

ALTER TABLE "MacoConsciousnessEvidence"
ADD CONSTRAINT "MacoConsciousnessEvidence_sourceId_fkey"
FOREIGN KEY ("sourceId") REFERENCES "MacoResearchSource"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

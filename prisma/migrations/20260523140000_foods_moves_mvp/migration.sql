-- MapAble Foods & Moves MVP
CREATE TYPE "FoodOrderStatus" AS ENUM ('draft', 'allergy_pending', 'submitted', 'scheduled', 'in_delivery', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "FoodTextureLevel" AS ENUM ('standard', 'soft', 'minced_moist', 'pureed', 'liquidised');

-- CreateEnum
CREATE TYPE "TherapyType" AS ENUM ('physiotherapy', 'occupational_therapy', 'speech_pathology', 'exercise_physiology', 'psychology', 'other');

-- CreateEnum
CREATE TYPE "TherapyDeliveryMode" AS ENUM ('telehealth', 'home_visit', 'clinic');

-- CreateEnum
CREATE TYPE "TherapyAppointmentStatus" AS ENUM ('draft', 'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "TherapistCredentialStatus" AS ENUM ('pending_review', 'verified', 'expired', 'rejected');

CREATE TABLE "DietaryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intolerances" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "culturalPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "textureRequirement" "FoodTextureLevel" NOT NULL DEFAULT 'standard',
    "swallowingRiskFlag" BOOLEAN NOT NULL DEFAULT false,
    "preferredMealTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportRequiredForMeals" BOOLEAN NOT NULL DEFAULT false,
    "nomineeCanOrder" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietaryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" TEXT NOT NULL,
    "textureLevel" "FoodTextureLevel" NOT NULL DEFAULT 'standard',
    "nutritionSummary" TEXT,
    "preparationRequired" BOOLEAN NOT NULL DEFAULT true,
    "storageInstructions" TEXT,
    "reheatingInstructions" TEXT,
    "ingredientCostCents" INTEGER NOT NULL DEFAULT 0,
    "preparationCostCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemAllergen" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "allergyId" TEXT NOT NULL,

    CONSTRAINT "MenuItemAllergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "dietaryProfileId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanItem" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MealPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSubscription" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "deliveryDay" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrder" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "FoodOrderStatus" NOT NULL DEFAULT 'draft',
    "bookingId" TEXT,
    "transportBookingId" TEXT,
    "allergyConfirmedAt" TIMESTAMP(3),
    "allergyConfirmedById" TEXT,
    "deliveryScheduledAt" TIMESTAMP(3),
    "deliveryAddress" TEXT,
    "participantNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOrderItem" (
    "id" TEXT NOT NULL,
    "foodOrderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitIngredientCents" INTEGER NOT NULL DEFAULT 0,
    "unitPreparationCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodInvoiceSplit" (
    "id" TEXT NOT NULL,
    "foodOrderId" TEXT NOT NULL,
    "ingredientCents" INTEGER NOT NULL DEFAULT 0,
    "preparationCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "plainLanguageNote" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodInvoiceSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodDeliveryRun" (
    "id" TEXT NOT NULL,
    "foodOrderId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "temperatureLog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodDeliveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSafetyEvent" (
    "id" TEXT NOT NULL,
    "foodOrderId" TEXT,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodSafetyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT,
    "displayName" TEXT NOT NULL,
    "profileSummary" TEXT,
    "therapyTypes" "TherapyType"[] DEFAULT ARRAY[]::"TherapyType"[],
    "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "credentialStatus" "TherapistCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "telehealthEnabled" BOOLEAN NOT NULL DEFAULT true,
    "homeVisitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapistCredential" (
    "id" TEXT NOT NULL,
    "therapistProfileId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" "TherapistCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "TherapistCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapyService" (
    "id" TEXT NOT NULL,
    "therapistProfileId" TEXT NOT NULL,
    "therapyType" "TherapyType" NOT NULL,
    "deliveryModes" "TherapyDeliveryMode"[] DEFAULT ARRAY[]::"TherapyDeliveryMode"[],
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TherapyService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapyAppointment" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "therapistProfileId" TEXT NOT NULL,
    "therapyType" "TherapyType" NOT NULL,
    "deliveryMode" "TherapyDeliveryMode" NOT NULL,
    "status" "TherapyAppointmentStatus" NOT NULL DEFAULT 'draft',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "transportRequired" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "transportBookingId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapyAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelehealthSession" (
    "id" TEXT NOT NULL,
    "therapyAppointmentId" TEXT NOT NULL,
    "secureLinkToken" TEXT NOT NULL,
    "linkExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "TelehealthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisitRiskCheck" (
    "id" TEXT NOT NULL,
    "therapyAppointmentId" TEXT NOT NULL,
    "checklistJson" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,

    CONSTRAINT "HomeVisitRiskCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapyGoal" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rehabPlanId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TherapyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehabPlan" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdByTherapistId" TEXT,
    "goalsSummary" TEXT,
    "interventions" TEXT,
    "reviewDate" TIMESTAMP(3),
    "participantVisibleSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehabPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressNote" (
    "id" TEXT NOT NULL,
    "therapyAppointmentId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "clinicalContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantProgressSummary" (
    "id" TEXT NOT NULL,
    "therapyAppointmentId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantProgressSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeMeasure" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "measureKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentRecommendation" (
    "id" TEXT NOT NULL,
    "therapyAppointmentId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "marketplaceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DietaryProfile_userId_key" ON "DietaryProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Allergy_slug_key" ON "Allergy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAllergen_menuItemId_allergyId_key" ON "MenuItemAllergen"("menuItemId", "allergyId");

-- CreateIndex
CREATE INDEX "FoodOrder_participantId_status_idx" ON "FoodOrder"("participantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FoodInvoiceSplit_foodOrderId_key" ON "FoodInvoiceSplit"("foodOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodDeliveryRun_foodOrderId_key" ON "FoodDeliveryRun"("foodOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "TherapistProfile_userId_key" ON "TherapistProfile"("userId");

-- CreateIndex
CREATE INDEX "TherapyAppointment_participantId_status_idx" ON "TherapyAppointment"("participantId", "status");

-- CreateIndex
CREATE INDEX "TherapyAppointment_therapistProfileId_idx" ON "TherapyAppointment"("therapistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthSession_therapyAppointmentId_key" ON "TelehealthSession"("therapyAppointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TelehealthSession_secureLinkToken_key" ON "TelehealthSession"("secureLinkToken");

-- CreateIndex
CREATE UNIQUE INDEX "HomeVisitRiskCheck_therapyAppointmentId_key" ON "HomeVisitRiskCheck"("therapyAppointmentId");

-- CreateIndex
CREATE INDEX "ProgressNote_therapyAppointmentId_idx" ON "ProgressNote"("therapyAppointmentId");

-- CreateIndex
CREATE INDEX "ParticipantProgressSummary_participantId_idx" ON "ParticipantProgressSummary"("participantId");

-- CreateIndex
CREATE INDEX "ClinicalAuditLog_entityType_entityId_idx" ON "ClinicalAuditLog"("entityType", "entityId");

ALTER TABLE "DietaryProfile" ADD CONSTRAINT "DietaryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAllergen" ADD CONSTRAINT "MenuItemAllergen_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAllergen" ADD CONSTRAINT "MenuItemAllergen_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES "Allergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_dietaryProfileId_fkey" FOREIGN KEY ("dietaryProfileId") REFERENCES "DietaryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSubscription" ADD CONSTRAINT "FoodSubscription_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodInvoiceSplit" ADD CONSTRAINT "FoodInvoiceSplit_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodDeliveryRun" ADD CONSTRAINT "FoodDeliveryRun_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSafetyEvent" ADD CONSTRAINT "FoodSafetyEvent_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistProfile" ADD CONSTRAINT "TherapistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistCredential" ADD CONSTRAINT "TherapistCredential_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "TherapistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyService" ADD CONSTRAINT "TherapyService_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "TherapistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyAppointment" ADD CONSTRAINT "TherapyAppointment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyAppointment" ADD CONSTRAINT "TherapyAppointment_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyAppointment" ADD CONSTRAINT "TherapyAppointment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelehealthSession" ADD CONSTRAINT "TelehealthSession_therapyAppointmentId_fkey" FOREIGN KEY ("therapyAppointmentId") REFERENCES "TherapyAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitRiskCheck" ADD CONSTRAINT "HomeVisitRiskCheck_therapyAppointmentId_fkey" FOREIGN KEY ("therapyAppointmentId") REFERENCES "TherapyAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyGoal" ADD CONSTRAINT "TherapyGoal_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyGoal" ADD CONSTRAINT "TherapyGoal_rehabPlanId_fkey" FOREIGN KEY ("rehabPlanId") REFERENCES "RehabPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabPlan" ADD CONSTRAINT "RehabPlan_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_therapyAppointmentId_fkey" FOREIGN KEY ("therapyAppointmentId") REFERENCES "TherapyAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgressSummary" ADD CONSTRAINT "ParticipantProgressSummary_therapyAppointmentId_fkey" FOREIGN KEY ("therapyAppointmentId") REFERENCES "TherapyAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgressSummary" ADD CONSTRAINT "ParticipantProgressSummary_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentRecommendation" ADD CONSTRAINT "EquipmentRecommendation_therapyAppointmentId_fkey" FOREIGN KEY ("therapyAppointmentId") REFERENCES "TherapyAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToWorker" ADD CONSTRAINT "_LanguageToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

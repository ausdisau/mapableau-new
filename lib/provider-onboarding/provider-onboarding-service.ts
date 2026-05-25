import type { Organisation } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import {
  completeOnboardingTask,
  startProviderOnboarding,
} from "@/lib/provider-onboarding-automation/onboarding-service";
import { createVerificationCase } from "@/lib/provider-verification/verification-case-service";
import type {
  InsuranceStepPayload,
  NdisStepPayload,
  OrganisationStepPayload,
  ProviderOnboardingPatchBody,
  ProviderOnboardingState,
  ProviderOnboardingStepId,
  RegionsStepPayload,
} from "@/types/provider-onboarding";

const WIZARD_TASK_KEYS: Record<ProviderOnboardingStepId, string> = {
  organisation: "organisation_profile",
  regions: "service_regions",
  ndis: "ndis_claim",
  insurance: "insurance",
  review: "verification_case",
};

const STEP_ORDER: ProviderOnboardingStepId[] = [
  "organisation",
  "regions",
  "ndis",
  "insurance",
  "review",
];

function stepFromOrganisation(org: Organisation): ProviderOnboardingStepId {
  if (!org.name?.trim() || !org.organisationType) return "organisation";
  if (!org.serviceRegions?.length) return "regions";
  if (!org.ndisRegistrationClaimed && !org.ndisRegistrationNumber) {
    return "ndis";
  }
  if (!org.insuranceStatus?.trim()) return "insurance";
  return "review";
}

function completedStepsFor(org: Organisation): ProviderOnboardingStepId[] {
  const done: ProviderOnboardingStepId[] = [];
  if (org.name?.trim() && org.organisationType) done.push("organisation");
  if (org.serviceRegions.length > 0) done.push("regions");
  if (org.ndisRegistrationClaimed || org.ndisRegistrationNumber) {
    done.push("ndis");
  }
  if (org.insuranceStatus?.trim()) done.push("insurance");
  if (
    org.verificationStatus === "pending_review" ||
    org.verificationStatus === "verified"
  ) {
    done.push("review");
  }
  return done;
}

async function ensureWizardWorkflow(organisationId: string) {
  let workflow = await prisma.providerOnboardingWorkflow.findFirst({
    where: { organisationId, status: { in: ["in_progress", "awaiting_review"] } },
    include: { tasks: true },
    orderBy: { createdAt: "desc" },
  });

  if (!workflow) {
    const created = await startProviderOnboarding(organisationId);
    workflow = await prisma.providerOnboardingWorkflow.findUniqueOrThrow({
      where: { id: created.id },
      include: { tasks: true },
    });
  }

  const activeWorkflow = workflow;

  const wizardKeys = Object.values(WIZARD_TASK_KEYS);
  const missing = wizardKeys.filter(
    (key) => !activeWorkflow.tasks.some((t) => t.taskKey === key),
  );
  if (missing.length > 0) {
    await prisma.providerOnboardingTask.createMany({
      data: missing.map((taskKey) => ({
        workflowId: activeWorkflow.id,
        taskKey,
        title: taskKey.replace(/_/g, " "),
        status: "pending",
      })),
    });
    return prisma.providerOnboardingWorkflow.findUniqueOrThrow({
      where: { id: activeWorkflow.id },
      include: { tasks: true },
    });
  }

  return activeWorkflow;
}

async function completeTaskForStep(
  workflowId: string,
  step: ProviderOnboardingStepId,
) {
  const taskKey = WIZARD_TASK_KEYS[step];
  const task = await prisma.providerOnboardingTask.findFirst({
    where: { workflowId, taskKey },
  });
  if (task && task.status !== "completed") {
    await completeOnboardingTask(task.id);
  }
}

export async function getProviderOnboardingState(
  organisationId: string,
): Promise<ProviderOnboardingState> {
  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: organisationId },
  });

  const workflow = await ensureWizardWorkflow(organisationId);
  const currentStep = stepFromOrganisation(org);
  const completedSteps = completedStepsFor(org);
  const submitted =
    org.verificationStatus === "pending_review" ||
    workflow.status === "awaiting_review";

  return {
    organisationId,
    organisation: {
      id: org.id,
      name: org.name,
      abn: org.abn,
      organisationType: org.organisationType,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      website: org.website,
      address: org.address,
      serviceRegions: org.serviceRegions,
      notes: org.notes,
      ndisRegistrationClaimed: org.ndisRegistrationClaimed,
      ndisRegistrationNumber: org.ndisRegistrationNumber,
      insuranceStatus: org.insuranceStatus,
      verificationStatus: org.verificationStatus,
    },
    workflowId: workflow.id,
    tasks: workflow.tasks.map((t) => ({
      id: t.id,
      taskKey: t.taskKey,
      title: t.title,
      status: t.status,
    })),
    currentStep,
    completedSteps,
    submitted,
    canAccessConsole: org.verificationStatus === "verified",
  };
}

export async function saveProviderOnboardingStep(
  organisationId: string,
  body: ProviderOnboardingPatchBody,
  actorUserId: string,
): Promise<ProviderOnboardingState> {
  const workflow = await ensureWizardWorkflow(organisationId);

  switch (body.step) {
    case "organisation": {
      const data = body.data as OrganisationStepPayload;
      await prisma.organisation.update({
        where: { id: organisationId },
        data: {
          name: data.name.trim(),
          abn: data.abn?.trim() || null,
          organisationType: data.organisationType,
          contactEmail: data.contactEmail?.trim() || null,
          contactPhone: data.contactPhone?.trim() || null,
          website: data.website?.trim() || null,
          address: data.address?.trim() || null,
        },
      });
      await completeTaskForStep(workflow.id, "organisation");
      break;
    }
    case "regions": {
      const data = body.data as RegionsStepPayload;
      await prisma.organisation.update({
        where: { id: organisationId },
        data: {
          serviceRegions: data.serviceRegions.map((r) => r.trim()).filter(Boolean),
          notes: data.notes?.trim() || null,
        },
      });
      await completeTaskForStep(workflow.id, "regions");
      break;
    }
    case "ndis": {
      const data = body.data as NdisStepPayload;
      await prisma.organisation.update({
        where: { id: organisationId },
        data: {
          ndisRegistrationClaimed: data.ndisRegistrationClaimed,
          ndisRegistrationNumber: data.ndisRegistrationNumber?.trim() || null,
        },
      });
      await completeTaskForStep(workflow.id, "ndis");
      break;
    }
    case "insurance": {
      const data = body.data as InsuranceStepPayload;
      const noteSuffix = data.insuranceNotes?.trim()
        ? `\n[Insurance note] ${data.insuranceNotes.trim()}`
        : "";
      const org = await prisma.organisation.findUniqueOrThrow({
        where: { id: organisationId },
        select: { notes: true },
      });
      await prisma.organisation.update({
        where: { id: organisationId },
        data: {
          insuranceStatus: data.insuranceStatus.trim(),
          notes: org.notes
            ? `${org.notes}${noteSuffix}`
            : noteSuffix.replace(/^\n/, "") || null,
        },
      });
      await completeTaskForStep(workflow.id, "insurance");
      break;
    }
    default:
      break;
  }

  await createAuditEvent({
    actorUserId,
    action: "provider.onboarding.step_saved",
    entityType: "Organisation",
    entityId: organisationId,
    organisationId,
    metadata: { step: body.step },
  });

  return getProviderOnboardingState(organisationId);
}

export async function submitProviderOnboarding(
  organisationId: string,
  actorUserId: string,
): Promise<ProviderOnboardingState> {
  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: organisationId },
  });

  if (!org.name?.trim()) {
    throw new Error("ORGANISATION_INCOMPLETE");
  }
  if (!org.serviceRegions.length) {
    throw new Error("REGIONS_REQUIRED");
  }
  if (!org.insuranceStatus?.trim()) {
    throw new Error("INSURANCE_REQUIRED");
  }

  const workflow = await ensureWizardWorkflow(organisationId);

  if (phase5Config.providerVerificationAdvancedEnabled) {
    const existingCase = await prisma.providerVerificationCase.findFirst({
      where: {
        organisationId,
        status: { in: ["draft", "submitted", "under_review"] },
      },
    });
    if (!existingCase) {
      await createVerificationCase(organisationId, actorUserId);
    }
  }

  await prisma.organisation.update({
    where: { id: organisationId },
    data: { verificationStatus: "pending_review" },
  });

  await completeTaskForStep(workflow.id, "review");

  const manualTask = await prisma.providerOnboardingTask.findFirst({
    where: { workflowId: workflow.id, taskKey: "manual_review" },
  });
  if (!manualTask) {
    await prisma.providerOnboardingTask.create({
      data: {
        workflowId: workflow.id,
        taskKey: "manual_review",
        title: "Await MapAble review",
        status: "pending",
      },
    });
  }

  await prisma.providerOnboardingWorkflow.update({
    where: { id: workflow.id },
    data: { status: "awaiting_review" },
  });

  await createAuditEvent({
    actorUserId,
    action: "provider.onboarding.submitted",
    entityType: "Organisation",
    entityId: organisationId,
    organisationId,
  });

  return getProviderOnboardingState(organisationId);
}

export function nextStepId(step: ProviderOnboardingStepId): ProviderOnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return null;
  return STEP_ORDER[idx + 1]!;
}

export function previousStepId(
  step: ProviderOnboardingStepId,
): ProviderOnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(step);
  if (idx <= 0) return null;
  return STEP_ORDER[idx - 1]!;
}

export { STEP_ORDER };

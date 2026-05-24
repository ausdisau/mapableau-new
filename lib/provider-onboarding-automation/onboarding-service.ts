import { phase5Config } from "@/lib/config/phase5";
import {
  createVerificationCase,
  submitVerificationCase,
} from "@/lib/provider-verification/verification-case-service";
import {
  runAbnCheckForCase,
} from "@/lib/provider-verification/abn-check-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_TASKS = [
  { taskKey: "verification_case", title: "Complete verification case" },
  { taskKey: "workers", title: "Register active workers" },
  { taskKey: "insurance", title: "Upload insurance document" },
  { taskKey: "manual_review", title: "Await manual admin review" },
];

export async function startProviderOnboarding(organisationId: string) {
  const existing = await prisma.providerOnboardingWorkflow.findFirst({
    where: { organisationId, status: "in_progress" },
  });
  if (existing) return existing;

  return prisma.providerOnboardingWorkflow.create({
    data: {
      organisationId,
      tasks: { create: DEFAULT_TASKS },
    },
    include: { tasks: true },
  });
}

export async function startVerificationCaseTask(
  organisationId: string,
  actorUserId: string
) {
  if (!phase5Config.providerVerificationAdvancedEnabled) {
    throw new Error("VERIFICATION_DISABLED");
  }
  const verificationCase = await createVerificationCase(organisationId, actorUserId);
  const result = await runAbnCheckForCase(verificationCase.id, actorUserId);
  return { case: verificationCase, abnCheck: result };
}

export async function completeVerificationCaseOnboardingTask(
  taskId: string,
  actorUserId: string
) {
  const task = await prisma.providerOnboardingTask.findUnique({
    where: { id: taskId },
    include: { workflow: true },
  });
  if (!task || task.taskKey !== "verification_case") {
    throw new Error("INVALID_TASK");
  }

  const latestCase = await prisma.providerVerificationCase.findFirst({
    where: { organisationId: task.workflow.organisationId },
    orderBy: { createdAt: "desc" },
    include: { checks: { where: { checkType: "abn" } } },
  });

  if (!latestCase) {
    await startVerificationCaseTask(task.workflow.organisationId, actorUserId);
  } else {
    const abnStatus = latestCase.checks[0]?.status;
    if (abnStatus !== "passed") {
      await runAbnCheckForCase(latestCase.id, actorUserId);
    }
  }

  const refreshed = await prisma.providerVerificationCase.findFirst({
    where: { organisationId: task.workflow.organisationId },
    orderBy: { createdAt: "desc" },
    include: { checks: { where: { checkType: "abn" } } },
  });

  const abnPassed = refreshed?.checks[0]?.status === "passed";
  if (abnPassed && refreshed?.status === "draft") {
    await submitVerificationCase(refreshed.id, actorUserId);
  }

  return completeOnboardingTask(taskId);
}

export async function completeOnboardingTask(taskId: string) {
  const task = await prisma.providerOnboardingTask.update({
    where: { id: taskId },
    data: { status: "completed" },
    include: { workflow: true },
  });

  const pending = await prisma.providerOnboardingTask.count({
    where: { workflowId: task.workflowId, status: { not: "completed" } },
  });
  if (pending === 0) {
    await prisma.providerOnboardingWorkflow.update({
      where: { id: task.workflowId },
      data: { status: "awaiting_review" },
    });
  }
  return task;
}

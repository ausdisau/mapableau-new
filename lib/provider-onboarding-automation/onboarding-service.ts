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

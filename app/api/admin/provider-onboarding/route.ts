import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  completeOnboardingTask,
  completeVerificationCaseOnboardingTask,
  startProviderOnboarding,
  startVerificationCaseTask,
} from "@/lib/provider-onboarding-automation/onboarding-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const workflows = await prisma.providerOnboardingWorkflow.findMany({
    include: { tasks: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return jsonOk({ workflows });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.taskId) {
    const existing = await prisma.providerOnboardingTask.findUnique({
      where: { id: body.taskId },
    });
    if (existing?.taskKey === "verification_case") {
      const task = await completeVerificationCaseOnboardingTask(
        body.taskId,
        user.id
      );
      return jsonOk({ task });
    }
    const task = await completeOnboardingTask(body.taskId);
    return jsonOk({ task });
  }
  if (body.startVerification && body.organisationId) {
    const result = await startVerificationCaseTask(body.organisationId, user.id);
    return jsonOk(result, 201);
  }
  const workflow = await startProviderOnboarding(body.organisationId);
  return jsonOk({ workflow }, 201);
}

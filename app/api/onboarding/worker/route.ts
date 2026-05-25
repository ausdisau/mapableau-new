import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitWorkerOnboarding } from "@/lib/onboarding/onboarding-service";
import { workerOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, workerOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitWorkerOnboarding(user.id, parsed.data));
}

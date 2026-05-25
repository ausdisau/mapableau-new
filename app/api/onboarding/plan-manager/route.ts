import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitPlanManagerOnboarding } from "@/lib/onboarding/onboarding-service";
import { planManagerOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, planManagerOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitPlanManagerOnboarding(user.id, parsed.data));
}

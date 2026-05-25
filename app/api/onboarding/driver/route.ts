import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitDriverOnboarding } from "@/lib/onboarding/onboarding-service";
import { driverOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, driverOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitDriverOnboarding(user.id, parsed.data));
}

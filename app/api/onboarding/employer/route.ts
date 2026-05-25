import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitEmployerOnboarding } from "@/lib/onboarding/onboarding-service";
import { employerOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, employerOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitEmployerOnboarding(user.id, parsed.data));
}

import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitProviderOnboarding } from "@/lib/onboarding/onboarding-service";
import { providerOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, providerOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitProviderOnboarding(user.id, parsed.data));
}

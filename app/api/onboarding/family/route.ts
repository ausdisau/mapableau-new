import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitFamilyOnboarding } from "@/lib/onboarding/onboarding-service";
import { familyOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, familyOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitFamilyOnboarding(user.id, parsed.data));
}

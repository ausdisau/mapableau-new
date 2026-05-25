import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitAlliedHealthOnboarding } from "@/lib/onboarding/onboarding-service";
import { alliedHealthOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, alliedHealthOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitAlliedHealthOnboarding(user.id, parsed.data));
}

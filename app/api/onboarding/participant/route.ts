import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitParticipantOnboarding } from "@/lib/onboarding/onboarding-service";
import { participantOnboardingSchema } from "@/lib/validation/onboarding-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, participantOnboardingSchema);
  if (!parsed.ok) return parsed.response;
  return apiJson(await submitParticipantOnboarding(user.id, parsed.data));
}

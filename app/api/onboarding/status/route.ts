import { getCurrentUser } from "@/lib/auth/current-user";
import { apiUnauthorized } from "@/lib/auth/guards";
import { getOnboardingStatusForApi } from "@/lib/onboarding/onboarding-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const onboarding = await getOnboardingStatusForApi(user.id);
  return Response.json(onboarding);
}

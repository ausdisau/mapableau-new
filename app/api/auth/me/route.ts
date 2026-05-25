import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatusForApi } from "@/lib/onboarding/onboarding-service";
import { apiUnauthorized } from "@/lib/auth/guards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const onboarding = await getOnboardingStatusForApi(user.id);

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    primaryRole: user.primaryRole,
    roles: user.roles,
    onboarding,
  });
}

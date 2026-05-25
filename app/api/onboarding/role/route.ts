import { apiJson, parseJsonBody, requireOnboardingUser } from "@/lib/onboarding/onboarding-api";
import { submitRoleSelection } from "@/lib/onboarding/onboarding-service";
import { roleSelectionSchema } from "@/lib/validation/registration-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, roleSelectionSchema);
  if (!parsed.ok) return parsed.response;

  const result = await submitRoleSelection(user.id, parsed.data.role);
  return apiJson(result);
}

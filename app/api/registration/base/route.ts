import {
  apiJson,
  parseJsonBody,
  requireOnboardingUser,
  requestMeta,
} from "@/lib/onboarding/onboarding-api";
import { submitBaseRegistration } from "@/lib/onboarding/onboarding-service";
import { baseRegistrationSchema } from "@/lib/validation/registration-schemas";

export async function POST(req: Request) {
  const auth = await requireOnboardingUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const parsed = await parseJsonBody(req, baseRegistrationSchema);
  if (!parsed.ok) return parsed.response;

  const result = await submitBaseRegistration(
    user.id,
    parsed.data,
    requestMeta(req)
  );
  return apiJson(result);
}

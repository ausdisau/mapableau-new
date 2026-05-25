import { requireProviderOnboardingApi } from "@/lib/provider-onboarding/provider-api-auth";
import { submitProviderOnboarding } from "@/lib/provider-onboarding/provider-onboarding-service";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const organisationIdParam = url.searchParams.get("organisationId");
  const auth = await requireProviderOnboardingApi(organisationIdParam);
  if (auth instanceof Response) return auth;

  try {
    const state = await submitProviderOnboarding(
      auth.organisationId,
      auth.user.id,
    );
    return jsonOk(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submit failed";
    if (message === "ORGANISATION_INCOMPLETE") {
      return jsonError("Complete your organisation profile before submitting.", 400);
    }
    if (message === "REGIONS_REQUIRED") {
      return jsonError("Add at least one service region before submitting.", 400);
    }
    if (message === "INSURANCE_REQUIRED") {
      return jsonError("Confirm your insurance documentation before submitting.", 400);
    }
    if (message === "VERIFICATION_DISABLED") {
      return jsonError("Verification is not enabled in this environment.", 503);
    }
    return jsonError(message, 400);
  }
}

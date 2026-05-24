import { requireProviderOnboardingApi } from "@/lib/provider-onboarding/provider-api-auth";
import {
  getProviderOnboardingState,
  saveProviderOnboardingStep,
} from "@/lib/provider-onboarding/provider-onboarding-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { ProviderOnboardingPatchBody } from "@/types/provider-onboarding";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const organisationIdParam = url.searchParams.get("organisationId");
  const auth = await requireProviderOnboardingApi(organisationIdParam);
  if (auth instanceof Response) return auth;

  const state = await getProviderOnboardingState(auth.organisationId);
  return jsonOk(state);
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const organisationIdParam = url.searchParams.get("organisationId");
  const auth = await requireProviderOnboardingApi(organisationIdParam);
  if (auth instanceof Response) return auth;

  let body: ProviderOnboardingPatchBody;
  try {
    body = (await req.json()) as ProviderOnboardingPatchBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body?.step || !body?.data) {
    return jsonError("step and data are required", 400);
  }

  const state = await saveProviderOnboardingStep(
    auth.organisationId,
    body,
    auth.user.id,
  );
  return jsonOk(state);
}

import type { OnboardingApiResponse } from "@/types/registration";

export async function postOnboarding(
  path: string,
  body: Record<string, unknown>
): Promise<OnboardingApiResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as OnboardingApiResponse;
}

export function fieldErrorsToMap(
  errors?: Array<{ field: string; message: string }>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of errors ?? []) {
    map[e.field] = e.message;
  }
  return map;
}

import type {
  AccessRequirements,
  CompatibilityEvaluation,
  CompatibilityResult,
} from "@/lib/gais/compatibility";

export type GaisCompatibilityResponse = {
  result: CompatibilityResult;
  evaluation: CompatibilityEvaluation;
  requirements: AccessRequirements;
  feature: {
    id: string;
    type: string;
    name?: string;
    placeId?: string;
  };
  meta: {
    claimState: string;
    evidenceScope: string;
    compatibilityScope: string;
  };
};

export async function fetchGaisCompatibility(input: {
  featureId?: string;
  placeId?: string;
  requirements?: AccessRequirements;
  useStoredProfile?: boolean;
  signal?: AbortSignal;
}): Promise<GaisCompatibilityResponse> {
  const res = await fetch("/api/gais/compatibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      featureId: input.featureId,
      placeId: input.placeId,
      requirements: input.requirements,
      useStoredProfile: input.useStoredProfile,
    }),
    signal: input.signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? `Compatibility request failed (${res.status})`);
  }

  return res.json() as Promise<GaisCompatibilityResponse>;
}

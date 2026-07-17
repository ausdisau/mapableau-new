import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isRegionalCapacityEnabled,
  isRegionalCapacityMatchingEnabled,
} from "@/lib/config/connected-capability-flags";
import {
  advanceCandidateState,
  createTaylorReturnTransportNeed,
  proposeSyntheticCandidates,
  regionalExchangeMeta,
} from "@/lib/regional-capacity";

const bodySchema = z.object({
  fixture: z.literal("taylor"),
  candidateId: z.string().optional(),
  advanceTo: z
    .enum([
      "candidate_found",
      "provider_available",
      "provider_accepted",
      "participant_approved",
      "service_confirmed",
      "service_delivered",
      "rejected",
      "expired",
    ])
    .optional(),
});

export async function GET(req: Request) {
  if (!isRegionalCapacityEnabled()) {
    return jsonError("MapAble Capacity is not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  const need = createTaylorReturnTransportNeed();
  const candidates = isRegionalCapacityMatchingEnabled()
    ? proposeSyntheticCandidates(need)
    : [];

  return jsonOk({
    need,
    candidates,
    meta: regionalExchangeMeta(),
    automaticAssignment: false,
    productionClaimState: "synthetic",
  });
}

export async function POST(req: Request) {
  if (!isRegionalCapacityEnabled() || !isRegionalCapacityMatchingEnabled()) {
    return jsonError("Regional capacity matching is not enabled", 503);
  }

  try {
    const body = bodySchema.parse(await req.json());
    const need = createTaylorReturnTransportNeed();
    let candidates = proposeSyntheticCandidates(need);

    if (body.candidateId && body.advanceTo) {
      candidates = candidates.map((c) => {
        if (c.id !== body.candidateId) return c;
        const next = advanceCandidateState(c, body.advanceTo!);
        if ("error" in next) return c;
        return next;
      });
    }

    return jsonOk({
      need,
      candidates,
      meta: regionalExchangeMeta(),
      note: "Participant approval required before service confirmation.",
      automaticAssignment: false,
      productionClaimState: "synthetic",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Capacity exchange failed", 500);
  }
}

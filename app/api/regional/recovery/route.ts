import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isRegionalRecoveryEnabled } from "@/lib/continuity-os/feature-flags";
import { searchRegionalRecoveryOptions } from "@/lib/continuity-os/regional/capacity";

const schema = z.object({
  regionCode: z.string().optional(),
  needs: z.array(z.string()).default([]),
});

export const GET = withContinuityHandler(async (_user, request) => {
  const disabled = disabledIf(
    isRegionalRecoveryEnabled(),
    "REGIONAL_RECOVERY_DISABLED"
  );
  if (disabled) return disabled;

  const url = new URL(request.url);
  const needs = url.searchParams.getAll("need");
  const regionCode = url.searchParams.get("regionCode") ?? undefined;
  const options = searchRegionalRecoveryOptions({ regionCode, needs });
  return Response.json({
    options,
    disclaimer:
      "Every regional option requires participant approval, provider confirmation and credential checks. No automatic assignment.",
  });
});

export const POST = withContinuityHandler(async (_user, request) => {
  const disabled = disabledIf(
    isRegionalRecoveryEnabled(),
    "REGIONAL_RECOVERY_DISABLED"
  );
  if (disabled) return disabled;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ContinuityOsError("VALIDATION_FAILED", "Invalid regional search.", 400);
  }
  const options = searchRegionalRecoveryOptions(parsed.data);
  return Response.json({ options });
});

import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { SUPPORT_NEEDS_LIFE_AREA_IDS } from "@/lib/intake/support-needs-assessor";
import {
  hardDenyOperationalActions,
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { enqueueHumanReview } from "@/lib/support-intelligence/human-review";
import { runServiceMatching } from "@/lib/support-intelligence/sma/matcher";
import { prepareSnaForMatching } from "@/lib/support-intelligence/sna/snapshot";
import { createFixtureSpiderAdapter } from "@/lib/support-intelligence/spider/fixture-adapter";

export const runtime = "nodejs";

const bodySchema = z.object({
  participantId: z.string().min(1).max(128),
  answers: z
    .array(
      z.object({
        domainId: z.enum(SUPPORT_NEEDS_LIFE_AREA_IDS),
        intensity: z.enum(["a_little", "some", "a_lot", "all_the_time"]),
      }),
    )
    .min(1)
    .max(12),
  priorityAreas: z.array(z.enum(SUPPORT_NEEDS_LIFE_AREA_IDS)).optional(),
  goals: z.array(z.string().max(200)).max(10).optional(),
  consentDraftProcessing: z.literal(true),
  consentWithdrawn: z.boolean().optional(),
  /**
   * Sandbox-only: match against synthetic fixtures.
   * Requires MAPABLE_SUPPORT_INTEL_SYNTHETIC_MATCH_ENABLED=true and non-production.
   */
  useSyntheticProviders: z.boolean().optional(),
});

function syntheticMatchAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.MAPABLE_SUPPORT_INTEL_SYNTHETIC_MATCH_ENABLED === "true";
}

/**
 * POST /api/support-intelligence/match
 * SNA → SMA eligibility-first matching. Booking/payment/dispatch denied.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-match:${ip}`, { windowMs: 60_000, max: 15 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  if (!isCapabilityEnabled("sma") || !isCapabilityEnabled("sna")) {
    return Response.json(
      {
        ok: false,
        reasonCode: supportIntelligenceFlags.killSwitch
          ? "kill_switch"
          : "capability_disabled",
        message: "SNA/SMA matching is disabled (fail-closed).",
        operationalActions: hardDenyOperationalActions(),
      },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid match request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.consentWithdrawn) {
    return Response.json(
      {
        ok: false,
        reasonCode: "consent_withdrawn",
        message: "Consent withdrawn — matching denied.",
        operationalActions: hardDenyOperationalActions(),
      },
      { status: 403 },
    );
  }

  if (parsed.data.useSyntheticProviders && !syntheticMatchAllowed()) {
    return Response.json(
      {
        ok: false,
        reasonCode: "capability_disabled",
        message:
          "Synthetic provider matching is disabled outside authorised non-production sandbox flags.",
        operationalActions: hardDenyOperationalActions(),
      },
      { status: 403 },
    );
  }

  const sna = prepareSnaForMatching({
    participantId: parsed.data.participantId,
    answers: parsed.data.answers,
    priorityAreas: parsed.data.priorityAreas,
    goals: parsed.data.goals,
    consentDraftProcessing: parsed.data.consentDraftProcessing,
  });

  if (!sna.ok) {
    return Response.json(sna, { status: 400 });
  }

  if (sna.complexSupport) {
    await enqueueHumanReview({
      reasons: ["complex_support_requirement"],
      entityType: "Participant",
      entityId: parsed.data.participantId,
      notes:
        "Complex support requirements require human review before any action.",
    });
  }

  const sources =
    parsed.data.useSyntheticProviders === true && syntheticMatchAllowed()
      ? (
          await createFixtureSpiderAdapter().fetchPage({
            pagination: { limit: 50 },
          })
        ).items.map((record) => ({
          // Preserve demo labelling — SMA excludes isDemo unless tests inject cleared rows.
          record,
          directoryActive: record.raw.Active,
          sourceDate:
            typeof record.raw.sourceDate === "string"
              ? record.raw.sourceDate
              : null,
          orgEligible: true as const,
        }))
      : [];

  const match = await runServiceMatching({
    sna,
    sources,
    consentWithdrawn: false,
  });

  return Response.json(
    {
      ...match,
      syntheticSandbox: parsed.data.useSyntheticProviders === true,
      operationalActions: hardDenyOperationalActions(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

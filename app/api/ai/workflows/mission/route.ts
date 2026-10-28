import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { z } from "zod";

import { mapAbleModuleSchema } from "@/intelligence/types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { mapAbleAgentMissionWorkflow } from "@/workflows/mapable-agent-mission";

const requestSchema = z.object({
  objective: z.string().trim().min(1).max(4000),
  domains: z.array(mapAbleModuleSchema).min(1).max(8),
  consentScopes: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  requestedCapabilities: z
    .array(z.string().trim().min(1).max(200))
    .max(50)
    .optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid durable mission request.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const missionId = crypto.randomUUID();
  const actorType =
    user.primaryRole === "participant" ? "participant" : "authorised_human";

  const run = await start(mapAbleAgentMissionWorkflow, [
    {
      missionId,
      objective: parsed.data.objective,
      domains: parsed.data.domains,
      actor: {
        actorId: user.id,
        actorType,
      },
      consentScopes: parsed.data.consentScopes,
      requestedCapabilities: parsed.data.requestedCapabilities,
    },
  ]);

  return NextResponse.json(
    {
      missionId,
      runId: run.runId,
      status: "started",
      execution: "vercel_workflow",
      note:
        "This slice performs governed mission activation and advisory reasoning only. It does not execute bookings, payments, claims, assignments, disclosures, clinical decisions, or safeguarding determinations.",
    },
    { status: 202 },
  );
}

import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { simulatePlan } from "@/lib/aura/plans/simulation";

const stepSchema = z.object({
  stepIndex: z.number().int(),
  actionSlug: z.string(),
  toolId: z.string().optional().nullable(),
  parents: z.array(z.number().int()).default([]),
  loopKind: z.enum(["none", "bounded", "unbounded"]).optional(),
  loopMaxIterations: z.number().int().positive().optional(),
});

const simulateSchema = z.object({
  plan: z.object({
    steps: z.array(stepSchema),
    allowedActionSlugs: z.array(z.string()),
    allowedToolIds: z.array(z.string()),
  }),
  inputs: z.record(z.string(), z.unknown()).default({}),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = simulateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Invalid simulation payload", 400);
  }
  const result = simulatePlan(parsed.data);
  return jsonOk({ result });
}

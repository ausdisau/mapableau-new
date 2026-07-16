import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  defaultInterviewTwin,
  listDefaultMutations,
  previewAllHarbourCounterfactuals,
  runCounterfactual,
} from "@/lib/access-intelligence/living";
import { buildHarbourLivingTwin } from "@/lib/access-intelligence/living/harbour-civic";

export async function GET() {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  return Response.json({
    mutations: listDefaultMutations(),
    results: previewAllHarbourCounterfactuals({
      personalTwin: defaultInterviewTwin(userId),
    }),
  });
}

const bodySchema = z.object({
  mutationId: z.string(),
  visitAt: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "mutationId required" }, { status: 400 });
  }
  const mutation = listDefaultMutations().find((m) => m.id === parsed.data.mutationId);
  if (!mutation) {
    return Response.json({ error: "Mutation not found" }, { status: 404 });
  }
  const result = runCounterfactual({
    twin: buildHarbourLivingTwin(),
    personalTwin: defaultInterviewTwin(userId),
    mutation,
    visitAt: parsed.data.visitAt,
    withMainLiftOutage: mutation.id === "mut-repair-main-lift",
  });
  return Response.json({ result, note: "Preview only — baseline twin unchanged." });
}

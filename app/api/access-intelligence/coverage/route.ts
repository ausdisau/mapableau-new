import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  calculateAccessCoverage,
  listDefaultMutations,
} from "@/lib/access-intelligence/living";

export async function GET() {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  return Response.json(calculateAccessCoverage());
}

const bodySchema = z.object({
  mutationId: z.string().optional(),
  visitAt: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const mutation = parsed.success
    ? listDefaultMutations().find((m) => m.id === parsed.data.mutationId)
    : undefined;
  return Response.json(
    calculateAccessCoverage({
      mutation,
      visitAt: parsed.success ? parsed.data.visitAt : undefined,
    }),
  );
}

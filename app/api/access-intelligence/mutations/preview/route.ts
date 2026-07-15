import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isDemoMode } from "@/lib/access-intelligence/configuration";
import {
  HARBOUR_MUTATIONS,
  applyMutation,
  buildHarbourLivingTwin,
  calculateAccessCoverage,
} from "@/lib/access-intelligence/living";

const drafts = new Map<string, { mutationId: string; savedAt: string; userId: string }>();

function assertImproveRole(roleHeader: string | null): boolean {
  if (isDemoMode()) {
    // Demo may preview roles client-side; still accept demo. Production enforces header below.
    return roleHeader === "venue_staff" || roleHeader === "admin" || roleHeader === "demo_preview";
  }
  return roleHeader === "venue_staff" || roleHeader === "admin";
}

export async function GET(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const role = request.headers.get("x-access-role");
  if (!assertImproveRole(role)) {
    return Response.json(
      { error: "Operate/Improve requires venue staff or admin.", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  return Response.json({
    mutations: HARBOUR_MUTATIONS,
    coverage: calculateAccessCoverage(),
    drafts: [...drafts.values()].filter((d) => d.userId === userId),
  });
}

const bodySchema = z.object({
  action: z.enum(["preview", "save_draft"]),
  mutationId: z.string(),
  visitAt: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const role = request.headers.get("x-access-role");
  if (!assertImproveRole(role)) {
    return Response.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const mutation = HARBOUR_MUTATIONS.find((m) => m.id === parsed.data.mutationId);
  if (!mutation) {
    return Response.json({ error: "Mutation not found" }, { status: 404 });
  }

  if (parsed.data.action === "save_draft") {
    const draft = {
      mutationId: mutation.id,
      savedAt: new Date().toISOString(),
      userId,
    };
    drafts.set(`${userId}:${mutation.id}`, draft);
    return Response.json({
      draft,
      note: "Draft saved. There is no Apply-to-real-building action in this demo.",
    });
  }

  const before = calculateAccessCoverage({ visitAt: parsed.data.visitAt });
  const afterTwin = applyMutation(buildHarbourLivingTwin(), mutation);
  const after = calculateAccessCoverage({
    twin: afterTwin,
    visitAt: parsed.data.visitAt,
  });
  return Response.json({
    mutation,
    beforeCoverage: before,
    afterCoverage: after,
    evidenceRequiredAfterCompletion: mutation.evidenceRequiredAfterCompletion,
    note: "Preview only — baseline Living Twin unchanged.",
  });
}

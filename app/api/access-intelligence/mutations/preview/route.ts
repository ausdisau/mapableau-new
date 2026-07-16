import { z } from "zod";

import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import {
  HARBOUR_MUTATIONS,
  HARBOUR_PLACE_ID,
  applyMutation,
  buildHarbourLivingTwin,
  calculateAccessCoverage,
} from "@/lib/access-intelligence/living";
import { getLivingPersistence } from "@/lib/access-intelligence/persistence";

async function assertImproveAccess(
  request: Request,
): Promise<Response | { userId: string }> {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;
  try {
    await requireVenueOperateAccess({
      user,
      placeId: HARBOUR_PLACE_ID,
      roleHeader: request.headers.get("x-access-role"),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 403 });
    }
    throw error;
  }
  return { userId: user.id };
}

export async function GET(request: Request) {
  const auth = await assertImproveAccess(request);
  if (auth instanceof Response) return auth;

  const persistence = getLivingPersistence();
  const drafts = await persistence.listMutationDrafts(auth.userId, HARBOUR_PLACE_ID);

  return Response.json({
    mutations: HARBOUR_MUTATIONS,
    coverage: calculateAccessCoverage(),
    drafts: drafts.map((d) => ({
      mutationId: d.mutationId,
      savedAt: d.updatedAt,
      userId: d.userId,
      draftId: d.id,
    })),
    persistence: persistence.kind,
  });
}

const bodySchema = z.object({
  action: z.enum(["preview", "save_draft"]),
  mutationId: z.string(),
  visitAt: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await assertImproveAccess(request);
  if (auth instanceof Response) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const mutation = HARBOUR_MUTATIONS.find((m) => m.id === parsed.data.mutationId);
  if (!mutation) {
    return Response.json({ error: "Mutation not found" }, { status: 404 });
  }

  if (parsed.data.action === "save_draft") {
    const draft = await getLivingPersistence().saveMutationDraft({
      placeId: HARBOUR_PLACE_ID,
      userId: auth.userId,
      mutation,
    });
    return Response.json({
      draft: {
        mutationId: draft.mutationId,
        savedAt: draft.updatedAt,
        userId: draft.userId,
        draftId: draft.id,
      },
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

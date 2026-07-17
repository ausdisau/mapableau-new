import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { submitDailyReview } from "@/lib/pilot/reviews/daily-review-service";

const bodySchema = z.object({
  reviewDate: z.string().datetime().optional(),
  checklist: z.record(z.string(), z.boolean()),
  findings: z.array(z.unknown()).optional(),
  notes: z.string().max(4000).optional(),
  outcome: z
    .enum([
      "continue",
      "continue_with_actions",
      "pause_recommended",
      "terminate_recommended",
      "escalate",
      "insufficient_evidence",
    ])
    .optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/reviews/daily */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:operations:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const review = await submitDailyReview({
      pilotId,
      reviewDate: parsed.data.reviewDate
        ? new Date(parsed.data.reviewDate)
        : new Date(),
      reviewedById: user.id,
      checklist: parsed.data.checklist,
      findings: parsed.data.findings,
      notes: parsed.data.notes,
      outcome: parsed.data.outcome,
    });
    return jsonNdisOk(
      {
        review: {
          id: review.id,
          outcome: review.outcome,
          reviewDate: review.reviewDate.toISOString(),
        },
      },
      201
    );
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}

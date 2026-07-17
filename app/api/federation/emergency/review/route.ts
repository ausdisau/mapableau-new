import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import { reviewEmergencyAccess } from "@/lib/access-passport/emergency";
import { z } from "zod";

const schema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["approved", "denied"]),
  ttlMinutes: z.number().min(1).max(24 * 60).default(60),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("federation:emergency:review");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fedZodError(parsed.error);
  const result = await reviewEmergencyAccess({
    requestId: parsed.data.requestId,
    reviewerId: user.id,
    decision: parsed.data.decision,
    ttlMinutes: parsed.data.ttlMinutes,
    reason: parsed.data.reason,
  });
  return fedJson({ request: result });
}

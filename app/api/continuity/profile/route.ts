import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { readContinuityProfile, upsertContinuityProfile } from "@/lib/continuity/profile/profile-service";

export const dynamic = "force-dynamic";

const upsertSchema = z.object({
  participantId: z.string().min(1),
  organisationId: z.string().optional(),
  goalsNarrative: z.string().optional(),
  essentialSupports: z.array(z.object({ label: z.string(), description: z.string().optional() })).optional(),
  prohibitedActions: z.array(z.string()).optional(),
  communicationPreference: z.object({
    preferredChannel: z.enum(["in_app", "sms", "email", "phone_human", "postal_human"]).optional(),
    languagePreference: z.string().optional(),
    contactHours: z.string().optional(),
  }).optional(),
  interpreterRequired: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid profile payload", 400);
  try {
    const profile = await upsertContinuityProfile({
      ...parsed.data,
      reviewedById: user.id,
    });
    return jsonOk({ profile });
  } catch (err) {
    return jsonError((err as Error).message ?? "PROFILE_ERROR", 400);
  }
}

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId");
  if (!participantId) return jsonError("participantId required", 400);
  const profile = await readContinuityProfile(participantId);
  return jsonOk({ profile });
}

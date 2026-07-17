import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import { discloseParticipantData } from "@/lib/data-federation/disclosure-gateway";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string().min(1),
  purpose: z.string().min(1),
  recipientCategory: z.string().min(1),
  recipientOrganisationId: z.string().nullish(),
  recipientEntityKey: z.string().nullish(),
  purposeSummary: z.string().min(3),
  requestedFields: z.array(z.string()),
  candidatePayload: z.record(z.string(), z.unknown()),
  privacyMode: z.enum(["minimum_necessary", "strict", "open"]).optional(),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("federation:disclosure:manage:any");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fedZodError(parsed.error);
  const result = await discloseParticipantData({
    subjectId: parsed.data.subjectId,
    actorId: user.id,
    purpose: parsed.data.purpose as never,
    recipientCategory: parsed.data.recipientCategory as never,
    recipientOrganisationId: parsed.data.recipientOrganisationId ?? null,
    recipientEntityKey: parsed.data.recipientEntityKey ?? null,
    purposeSummary: parsed.data.purposeSummary,
    requestedFields: parsed.data.requestedFields,
    candidatePayload: parsed.data.candidatePayload,
    privacyMode: parsed.data.privacyMode ?? "minimum_necessary",
    simulator: true,
  });
  return fedJson(result);
}
